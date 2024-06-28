import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device, DeviceStatus } from './device.entity';
import { Repository } from 'typeorm';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { KV } from 'nats';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject('KEYVALUE_DEVICES') private kvDevices: KV,
  ) {}

  async findAllDevices(): Promise<Device[]> {
    return this.deviceRepository.find();
  }

  async findDeviceById(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { id } });

    if (!device) throw new NotFoundException('Device not founded.');

    const status = (await this.kvDevices.get(device.id)).json<DeviceStatus>();
    device['status'] = status;

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
