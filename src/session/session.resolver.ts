import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { CreateSessionInput } from './dto/create-session.input';
import { Session } from './session.entity';
import { UpdateSessionInput } from './dto/update-session.input';
import { NotFoundException, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  RoleGuard,
  RoleMatchingMode,
  Roles,
  Resource,
  AuthenticatedUser,
} from 'nest-keycloak-connect';
import { Device } from 'src/device/device.entity';
import { DeviceService } from 'src/device/device.service';
import { GetAllSessionInput } from './dto/get-all-session.input';
import { GetAllSessionOutput } from './dto/get-all-session.output';
import { subDays } from 'date-fns';
import { LogService } from 'src/log/log.service';
import { ConfigService } from '@nestjs/config';
import { EventType, LogLevel } from 'src/log/log.entity';

@Resolver('Session')
@UseGuards(AuthGuard, RoleGuard)
@Resource('session')
export class SessionResolver {
  constructor(
    private sessionService: SessionService,
    private deviceService: DeviceService,
    private logService: LogService,
    private readonly configService: ConfigService,
  ) {}

  @Query(() => GetAllSessionOutput)
  @Resource('session')
  async sessions(
    @Args() args: GetAllSessionInput,
  ): Promise<GetAllSessionOutput> {
    const {
      limit: take = 100,
      offset = 0,
      startDate,
      endDate,
      deviceId,
    } = args;

    const limit = Math.min(take, 1000);

    const now = new Date();
    const ninetyDaysAgo = subDays(now, 90);

    const actualStartDate = startDate ? new Date(startDate) : ninetyDaysAgo;
    const actualEndDate = endDate ? new Date(endDate) : now;

    const [sessions, totalCount] = await this.sessionService.findAllSessions({
      skip: offset,
      take: limit,
      startDate: actualStartDate.toISOString(),
      endDate: actualEndDate.toISOString(),
      deviceId,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      sessions,
      pagination: {
        limit,
        totalCount,
        totalPages,
      },
      criterias: {
        startDate: actualStartDate.toISOString(),
        endDate: actualEndDate.toISOString(),
      },
    };
  }

  @Query(() => Session)
  @Resource('session')
  async session(@Args('id') id: string): Promise<Session> {
    return this.sessionService.findSessionById(id);
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Session)
  async createSession(
    @Args('data') data: CreateSessionInput,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<Session> {
    const { deviceId, watchers, ...rest } = data;
    const sessionData: CreateSessionInput = { deviceId, ...rest };

    let devices: Device[] = [];
    if (watchers && watchers.length > 0) {
      devices = await Promise.all(
        watchers.map((id) => this.deviceService.findDeviceById(id)),
      );
    }

    const createdSession = await this.sessionService.createSession({
      ...sessionData,
      watchers: devices,
    });

    await this.logService.createLog({
      level: LogLevel.INFO,
      payload: createdSession,
      message: 'created an session.',
      operation: `${this.configService.get<string>('serviceName')}:session:create`,
      eventType: EventType.UPDATE,
      userId: user.sub,
    });

    return createdSession;
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Session)
  @Resource('session')
  async updateSession(
    id: string,
    data: UpdateSessionInput,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<Session> {
    const { watchers } = data;

    const session = await this.sessionService.findSessionById(id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    let devices: Device[] = [];
    if (watchers && watchers.length > 0) {
      devices = await Promise.all(
        watchers.map((id) => this.deviceService.findDeviceById(id)),
      );
    }

    const payload = await this.sessionService.updateSession(id, {
      ...data,
      ...(devices.length && { watchers: devices }),
    });

    await this.logService.createLog({
      level: LogLevel.INFO,
      payload: { id, ...data },
      message: 'updated an session.',
      operation: `${this.configService.get<string>('serviceName')}:session:update`,
      eventType: EventType.UPDATE,
      userId: user.sub,
    });

    return payload;
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Boolean)
  @Resource('session')
  async deleteSession(
    @Args('id') id: string,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<boolean> {
    const deleted = await this.sessionService.deleteSession(id);

    if (deleted)
      await this.logService.createLog({
        level: LogLevel.INFO,
        payload: id,
        message: 'deleted an session.',
        operation: `${this.configService.get<string>('serviceName')}:session:delete`,
        eventType: EventType.DELETE,
        userId: user.sub,
      });

    return deleted;
  }

  @Roles({
    roles: ['realm:can_use_remote_connections'],
    mode: RoleMatchingMode.ANY,
  })
  @Mutation(() => Boolean)
  @Resource('session')
  async closeSession(
    @Args('id') id: string,
    @AuthenticatedUser() user: { sub: string; name?: string; email?: string },
  ): Promise<boolean> {
    const closed = await this.sessionService.closeSession(id);

    if (closed)
      await this.logService.createLog({
        level: LogLevel.INFO,
        payload: id,
        message: 'closed an session.',
        operation: `${this.configService.get<string>('serviceName')}:session:close`,
        eventType: EventType.POST,
        userId: user.sub,
      });

    return closed;
  }
}
