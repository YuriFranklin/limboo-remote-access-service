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
import {
  GetAllDeviceOutput,
  DevicePagination,
} from './dto/get-all-device.output';

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

  async findAllDevices(
    userId?: string,
    options?: { skip?: number; take?: number },
  ): Promise<GetAllDeviceOutput> {
    const { skip = 0, take = 100 } = options || {};

    const limit = Math.min(take, 1000);

    let queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .skip(skip)
      .take(limit);

    if (userId) {
      queryBuilder = queryBuilder
        .where('device.ownerId = :userId', { userId })
        .orWhere('device.coOwnersId LIKE :userId', { userId: `%${userId}%` });
    }

    const [devices, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);

    const pagination: DevicePagination = {
      limit,
      totalCount,
      totalPages,
    };

    return { devices, pagination };
  }

  async findDeviceById(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) throw new NotFoundException('Device not founded.');

    const storedOnKVDevice = (await this.kvDevices.get(device.id)).json<{
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
