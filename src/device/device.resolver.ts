import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
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
  AuthenticatedUser,
} from 'nest-keycloak-connect';
import { UpdateDeviceInput } from './dto/update-device.input';
import { GetAllDeviceInput } from './dto/get-all-device.input';
import { GetAllDeviceOutput } from './dto/get-all-device.output';
import { LogService } from 'src/log/log.service';
import { ConfigService } from '@nestjs/config';
import { EventType, LogLevel } from 'src/log/log.entity';

@Resolver('Device')
@UseGuards(AuthGuard, RoleGuard)
@Resource('device')
export class DeviceResolver {
  constructor(
    private deviceService: DeviceService,
    private logService: LogService,
    private readonly configService: ConfigService,
  ) {}

  @ResolveField('owner')
  getUser(@Parent() device: Device) {
    return { __typename: 'User', id: device.ownerId };
  }

  @Query(() => GetAllDeviceOutput)
  @Resource('device')
  async devices(@Args() args: GetAllDeviceInput): Promise<GetAllDeviceOutput> {
    return this.deviceService.findAllDevices(args);
  }

  @Query(() => Device, { nullable: true })
  @Resource('device')
  async device(
    @Args('id', { nullable: true }) id?: string,
    @Args('mac', { nullable: true }) mac?: string,
  ): Promise<Device> {
    if (id) {
      return this.deviceService.findDeviceById(id);
    } else if (mac) {
      return this.deviceService.findDeviceByMac(mac);
    }
    throw new Error('Either id or mac must be provided');
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Device)
  @Resource('device')
  async createDevice(
    @Args('data') data: CreateDeviceInput,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<Device> {
    const createdDevice = await this.deviceService.createDevice(data);

    if (createdDevice)
      await this.logService.createLog({
        level: LogLevel.INFO,
        payload: createdDevice,
        message: 'created an device.',
        operation: `${this.configService.get<string>('serviceName')}:device:create`,
        eventType: EventType.CREATE,
        userId: user.sub,
      });

    return createdDevice;
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
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<Device> {
    const updatedDevice = await this.deviceService.updateDevice(id, data);

    if (updatedDevice)
      await this.logService.createLog({
        level: LogLevel.INFO,
        payload: { id, ...data },
        message: 'updated an device.',
        operation: `${this.configService.get<string>('serviceName')}:device:update`,
        eventType: EventType.DELETE,
        userId: user.sub,
      });

    return updatedDevice;
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Boolean)
  @Resource('device')
  async deleteDevice(
    @Args('id') id: string,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<boolean> {
    const deleted = await this.deviceService.deleteDevice(id);

    if (deleted)
      await this.logService.createLog({
        level: LogLevel.INFO,
        payload: id,
        message: 'deleted an device.',
        operation: `${this.configService.get<string>('serviceName')}:device:delete`,
        eventType: EventType.DELETE,
        userId: user.sub,
      });

    return deleted;
  }
}
