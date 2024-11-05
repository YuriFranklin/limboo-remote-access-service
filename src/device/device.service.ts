import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CachedDevice,
  Device,
  DeviceStatus,
  ExtendedDevice,
} from './device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { NATS_JS, NATS_KV_STORE } from 'src/common/constants/constants';
import { JetStreamClient, KV, KvOptions } from 'nats';
import { GetAllDeviceOutput } from './dto/get-all-device.output';
import {
  DeviceOrderBy,
  GetAllDeviceInput,
  OrderDirection,
} from './dto/get-all-device.input';
import { NatsService } from 'src/nats/nats.service';
import { PatchDeviceInput } from './dto/patch-device.input';

@Injectable()
export class DeviceService implements OnModuleInit {
  private kvDevices: KV;
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject(NATS_KV_STORE)
    private kvStore: (name: string, opts?: Partial<KvOptions>) => Promise<KV>,
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
    private readonly natsService: NatsService,
  ) {}

  async onModuleInit() {
    try {
      this.kvDevices = await this.kvStore('devices');

      await this.natsService.ensureStreamExists('devices-stream', [
        'devices:created',
        'devices:updated',
        'devices:deleted',
        'devices:kv:upsert',
        'devices:kv:delete',
      ]);
    } catch (error) {
      console.error('Failed to initialize device module:', error);
    }
  }

  async findAllDevices({
    limit = 100,
    offset = 0,
    orderBy = DeviceOrderBy.CREATED_AT,
    orderDirection = OrderDirection.ASC,
    userId,
  }: GetAllDeviceInput): Promise<GetAllDeviceOutput> {
    const skip = offset || 0;
    const take = Math.min(limit || 100, 1000);

    let devices: Device[];
    let totalCount: number;

    if (orderBy === DeviceOrderBy.STATUS) {
      devices = await this.deviceRepository
        .createQueryBuilder('device')
        .where(
          userId
            ? 'device.ownerId = :userId OR device.coOwnersId LIKE :userId'
            : '1=1',
          { userId },
        )
        .getMany();

      devices = await Promise.all(
        devices.map(async (device) => {
          try {
            const storedOnKVDevice = (
              await this.kvDevices.get(device.id)
            ).json<CachedDevice>();
            device['status'] = storedOnKVDevice.status ?? DeviceStatus.UNKNOWN;
            device['hostingSessions'] = storedOnKVDevice?.hostingSessions ?? [];
          } catch (e) {
            device['status'] = DeviceStatus.UNKNOWN;
            device['hostingSessions'] = [];
          }
          return device;
        }),
      );

      devices.sort((a, b) => {
        if (orderDirection === 'ASC') {
          return a.status.localeCompare(b.status);
        } else {
          return b.status.localeCompare(a.status);
        }
      });

      totalCount = devices.length;
      devices = devices.slice(skip, skip + take);
    } else {
      const [result, count] = await this.deviceRepository
        .createQueryBuilder('device')
        .where(
          userId
            ? 'device.ownerId = :userId OR device.coOwnersId LIKE :userId'
            : '1=1',
          { userId },
        )
        .orderBy(`device.${orderBy}`, orderDirection)
        .skip(skip)
        .take(take)
        .getManyAndCount();

      devices = await Promise.all(
        result.map(async (device) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { updatedAt, retries, accountId, ...rest } =
              await this.getKVDevice(device.id);

            const deviceWithKVorDevice = rest ? { ...device, ...rest } : device;

            return deviceWithKVorDevice;
          } catch (e) {
            this.logger.warn('[findAllDevices]: ', e);
          }
          return device;
        }),
      );

      totalCount = count;
    }

    return {
      devices,
      pagination: {
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findDeviceById(id: string): Promise<ExtendedDevice> {
    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Device not founded.');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { updatedAt, accountId, retries, ...rest } =
        await this.getKVDevice(id);

      const deviceWithKVorDevice = rest ? { ...device, ...rest } : device;

      return deviceWithKVorDevice;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findDeviceByMac(mac: string): Promise<ExtendedDevice> {
    const device = await this.deviceRepository.findOne({ where: { mac } });

    if (!device) throw new NotFoundException('Device not founded.');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { updatedAt, accountId, retries, ...rest } = await this.getKVDevice(
        device.id,
      );

      const deviceWithKVorDevice = rest ? { ...device, ...rest } : device;

      return deviceWithKVorDevice;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async createDevice(data: CreateDeviceInput) {
    const device = this.deviceRepository.create(data);

    const savedDevice = await this.deviceRepository.save(device);

    if (!savedDevice)
      throw new InternalServerErrorException(
        'An exception has occurred on server.',
      );

    await this.jetStream.publish(
      'devices:created',
      JSON.stringify({ id: device.id }),
    );

    return savedDevice;
  }

  async updateDevice(id: string, data: UpdateDeviceInput) {
    const device = await this.deviceRepository.save({ ...data });

    if (!device) throw new NotFoundException('Device not founded.');

    await this.jetStream.publish(
      'devices:updated',
      JSON.stringify({ id: device.id }),
    );

    return device;
  }

  async patchDevice(id: string, data: PatchDeviceInput) {
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) throw new NotFoundException('Device not found.');

    const updatedDevice = await this.deviceRepository.save({
      ...device,
      ...data,
      id,
    });

    await this.jetStream.publish(
      'devices:updated',
      JSON.stringify({ id: updatedDevice.id }),
    );

    return updatedDevice;
  }

  async deleteDevice(id: string): Promise<boolean> {
    const deleted = await this.deviceRepository.delete({ id });

    if (deleted) {
      await this.jetStream.publish(
        'devices:deleted',
        JSON.stringify({ id: id }),
      );

      return true;
    }

    return false;
  }

  async addCoOwner(id: string, coOwnerId: string): Promise<void> {
    const device = await this.findDeviceById(id);

    if (!device) throw new NotFoundException('Device not founded.');

    await this.updateDevice(id, {
      ...device,
      coOwnersId: [...device.coOwnersId, coOwnerId],
    });
  }

  async getKVDevice(id: string): Promise<CachedDevice | null> {
    try {
      const storedDeviceEntry = await this.kvDevices.get(id);

      if (!storedDeviceEntry) {
        this.logger.warn(
          `[getKVDevice]: Device with ID ${id} not found in KV Store.`,
        );
        return null;
      }

      let storedDevice: CachedDevice;
      try {
        if (
          storedDeviceEntry.value === null ||
          storedDeviceEntry.string() === ''
        ) {
          this.logger.warn(
            `[getKVDevice]: Device found for ID ${id}, but is null.`,
          );

          return null;
        }

        storedDevice = storedDeviceEntry.json<CachedDevice>();
        this.logger.log(
          `[getKVDevice]: Device found for ID ${id}`,
          storedDevice,
        );
      } catch (error) {
        this.logger.error(
          `[getKVDevice]: Error parsing JSON for device ID ${id}:`,
          error,
        );
        this.logger.error(storedDeviceEntry.value);
        throw new Error(`Failed to parse device data for ID ${id}`);
      }

      return storedDevice;
    } catch (error) {
      this.logger.error(
        `[getKVDevice]: Error retrieving device with ID ${id} from KV Store:`,
        error,
      );
      throw new Error(`Error retrieving device with ID ${id}`);
    }
  }

  async upsertKVDevice(id: string, data: CachedDevice): Promise<CachedDevice> {
    const device = await this.getKVDevice(id);

    const updatedDevice = device ? { ...device, ...data } : { ...data };
    const deviceData = JSON.stringify(updatedDevice);

    try {
      JSON.parse(deviceData);
    } catch (error) {
      this.logger.error(
        `upsertKVDevice: Invalid JSON to store in KV Store: ${error.message}`,
      );
      throw new Error('Invalid device data JSON');
    }

    await this.kvDevices.put(id, deviceData);
    this.logger.log(
      '[upsertKVDevice]: Device successfully updated in KV Store',
      deviceData,
    );

    await this.jetStream.publish('devices:kv:upsert', JSON.stringify({ id }));
    return data;
  }
}
