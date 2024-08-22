import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device, DeviceStatus } from './device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { NATS_KV_STORE } from 'src/common/constants/constants';
import { KV, KvOptions } from 'nats';
import { GetAllDeviceOutput } from './dto/get-all-device.output';
import { GetAllDeviceInput, OrderDirection } from './dto/get-all-device.input';

@Injectable()
export class DeviceService implements OnModuleInit {
  private kvDevices: KV;

  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject(NATS_KV_STORE)
    private kvStore: (name: string, opts?: Partial<KvOptions>) => Promise<KV>,
  ) {}

  async onModuleInit() {
    try {
      this.kvDevices = await this.kvStore('devices');
    } catch (error) {
      console.error('Failed to initialize kvDevices:', error);
    }
  }

  async findAllDevices({
    limit = 100,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = OrderDirection.ASC,
    userId,
  }: GetAllDeviceInput): Promise<GetAllDeviceOutput> {
    const skip = offset || 0;
    const take = Math.min(limit || 100, 1000);

    let devices: Device[];
    let totalCount: number;

    if (orderBy === 'status') {
      devices = await this.deviceRepository
        .createQueryBuilder('device')
        .where(
          userId
            ? 'device.ownerId = :userId OR device.coOwnersId LIKE :userId'
            : '1=1',
          { userId },
        )
        .getMany();

      // Fetch status for each device from KV store
      devices = await Promise.all(
        devices.map(async (device) => {
          try {
            const storedOnKVDevice = (
              await this.kvDevices.get(device.mac)
            ).json<{
              status: DeviceStatus;
            }>();
            device['status'] = storedOnKVDevice.status ?? DeviceStatus.UNKNOWN;
          } catch (e) {
            device['status'] = DeviceStatus.UNKNOWN;
          }
          return device;
        }),
      );

      // Sort devices by status
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
            const storedOnKVDevice = (
              await this.kvDevices.get(device.mac)
            ).json<{
              status: DeviceStatus;
            }>();
            device['status'] = storedOnKVDevice.status ?? DeviceStatus.UNKNOWN;
          } catch (e) {
            device['status'] = DeviceStatus.UNKNOWN;
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

  async findDeviceById(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) throw new NotFoundException('Device not founded.');

    const storedOnKVDevice = (await this.kvDevices.get(device.mac)).json<{
      status: DeviceStatus;
    }>();
    device['status'] = storedOnKVDevice.status;

    return device;
  }

  async findDeviceByMac(mac: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { mac } });

    if (!device) throw new NotFoundException('Device not founded.');

    const storedOnKVDevice = (await this.kvDevices.get(device.mac)).json<{
      status: DeviceStatus;
    }>();
    device['status'] = storedOnKVDevice.status;

    return device;
  }

  async createDevice(data: CreateDeviceInput) {
    const device = this.deviceRepository.create(data);

    const savedDevice = await this.deviceRepository.save(device);

    if (!savedDevice)
      throw new InternalServerErrorException(
        'An exception has occurred on server.',
      );

    return savedDevice;
  }

  async updateDevice(id: string, data: UpdateDeviceInput) {
    const device = await this.deviceRepository.update({ id }, { ...data });

    if (!device) throw new NotFoundException('Device not founded.');

    const deviceUpdated = this.deviceRepository.create({ ...device, ...data });
    return deviceUpdated;
  }

  async deleteDevice(id: string): Promise<boolean> {
    const deleted = await this.deviceRepository.delete({ id });

    if (deleted) {
      return true;
    }

    return false;
  }
}
