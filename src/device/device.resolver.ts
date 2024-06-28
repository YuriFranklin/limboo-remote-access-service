import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeviceService } from './device.service';
import { CreateDeviceInput } from './dto/create-device.input';
import { Device } from './device.entity';
import { UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  RoleGuard,
  RoleMatchingMode,
  Roles,
  Resource,
} from 'nest-keycloak-connect';
import { UpdateDeviceInput } from './dto/update-device.input';

@Resolver('Device')
@UseGuards(AuthGuard, RoleGuard)
@Resource('device')
export class DeviceResolver {
  constructor(private deviceService: DeviceService) {}

  @Query(() => [Device])
  @Resource('device')
  async devices(): Promise<Device[]> {
    return this.deviceService.findAllDevices();
  }

  @Query(() => Device)
  @Resource('device')
  async device(@Args('id') id: string): Promise<Device> {
    return this.deviceService.findDeviceById(id);
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Device)
  @Resource('device')
  async createDevice(@Args('data') data: CreateDeviceInput): Promise<Device> {
    return this.deviceService.createDevice(data);
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Device)
  @Resource('device')
  async updateDevice(
    @Args('id') id: string,
    @Args('data') data: UpdateDeviceInput,
  ): Promise<Device> {
    return this.deviceService.updateDevice(id, data);
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Boolean)
  @Resource('device')
  async deleteDevice(@Args('id') id: string): Promise<boolean> {
    return this.deviceService.deleteDevice(id);
  }
}
