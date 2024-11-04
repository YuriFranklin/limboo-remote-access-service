import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Session } from './session.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { UpdateSessionInput } from './dto/update-session.input';
import { Device, DeviceStatus } from 'src/device/device.entity';
import { JetStreamClient, KV, KvOptions, PubAck } from 'nats';
import { NATS_JS, NATS_KV_STORE } from 'src/common/constants/constants';
import { UnavailableException } from '../common/exceptions/unavailable.exception';
import { Between } from 'typeorm';
import { subDays } from 'date-fns';
import { DeviceService } from 'src/device/device.service';
import { ForbiddenError } from '@nestjs/apollo';
import { NatsService } from 'src/nats/nats.service';

type KVSessionData = {
  hostId: string;
  createdAt: Date;
  watchers: {
    id: string;
    isControlling: boolean;
  }[];
};

type SessionWithKvData = Session & {
  isLiving?: boolean;
  watchers?: (Device & { isControlling: boolean })[];
};

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly logger = new Logger(SessionService.name);
  private kvSessions: KV;

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @Inject(NATS_KV_STORE)
    private kvStore: (name: string, opts?: Partial<KvOptions>) => Promise<KV>,
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
    private readonly deviceService: DeviceService,
    private readonly natsService: NatsService,
  ) {}

  async onModuleInit() {
    try {
      this.kvSessions = await this.kvStore('sessions');

      await this.natsService.ensureStreamExists('sessions-stream', [
        'sessions:create',
        'sessions:stop',
      ]);
    } catch (error) {
      console.error('Failed to initialize sessions module:', error);
    }
  }

  private async attachSessionData(
    sessions: Session[],
  ): Promise<SessionWithKvData[]> {
    if (sessions.length <= 1) {
      return await Promise.all(
        sessions.map(async (session) => {
          try {
            const sessionData = (
              await this.kvSessions.get(session.id)
            ).json<KVSessionData>();

            if (sessionData) {
              const watchers = session.watchers?.map((watcher) => {
                const matchedWatcher = sessionData.watchers.find(
                  (w) => w.id === watcher.id,
                );
                return {
                  ...watcher,
                  isControlling: matchedWatcher
                    ? matchedWatcher.isControlling
                    : false,
                };
              });

              return {
                ...session,
                isLiving: true,
                watchers,
              } as SessionWithKvData;
            }
          } catch (error) {
            this.logger.error(
              `Failed to fetch session data for session ID ${session.id}: ${error.message}`,
            );
          }
          return session as SessionWithKvData;
        }),
      );
    }

    const kvKeys: string[] = [];
    const iterator = await this.kvSessions.keys();
    for await (const key of iterator) {
      kvKeys.push(key);
    }

    return await Promise.all(
      sessions.map(async (session) => {
        if (!kvKeys.includes(session.id)) {
          return session as SessionWithKvData;
        }

        try {
          const sessionData = (
            await this.kvSessions.get(session.id)
          ).json<KVSessionData>();

          if (sessionData) {
            const watchers = session.watchers?.map((watcher) => {
              const matchedWatcher = sessionData.watchers.find(
                (w) => w.id === watcher.id,
              );
              return {
                ...watcher,
                isControlling: matchedWatcher
                  ? matchedWatcher.isControlling
                  : false,
              };
            });

            return {
              ...session,
              isLiving: true,
              watchers,
            } as SessionWithKvData;
          }
        } catch (error) {
          this.logger.error(
            `Failed to fetch session data for session ID ${session.id}: ${error.message}`,
          );
        }
        return session as SessionWithKvData;
      }),
    );
  }

  async findAllSessions(options?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    deviceId?: string;
  }): Promise<[SessionWithKvData[], number]> {
    const {
      skip = 0,
      take = 100,
      startDate,
      endDate,
      deviceId,
    } = options || {};
    const now = new Date();
    const ninetyDaysAgo = subDays(now, 90);

    const whereClause: FindOptionsWhere<Session> = {
      createdAt: Between(
        startDate ? new Date(startDate) : ninetyDaysAgo,
        endDate ? new Date(endDate) : now,
      ),
    };

    if (deviceId) {
      whereClause.deviceId = deviceId;
    }

    const [sessions, totalCount] = await this.sessionRepository.findAndCount({
      skip,
      take: Math.min(take, 1000),
      where: whereClause,
      order: { createdAt: 'DESC' },
    } as FindManyOptions<Session>);

    const sessionsPassedOnKV = await this.attachSessionData(sessions);

    return [sessionsPassedOnKV, totalCount];
  }

  async findSessionById(id: string): Promise<SessionWithKvData> {
    const session = await this.sessionRepository.findOne({ where: { id } });

    if (!session) throw new NotFoundException('Session not found.');

    const sessionPassedOnKV = await this.attachSessionData([session]);

    return sessionPassedOnKV[0];
  }

  async createSession(
    data: CreateSessionInput,
    user: { sub: string; name?: string; email?: string },
  ): Promise<Session> {
    const device = await this.deviceService.findDeviceById(data.deviceId);

    if (!device)
      throw new NotFoundException(
        `Cannot start session because device with ID ${data.deviceId} was not found.`,
      );

    if (
      device.ownerId !== user.sub &&
      !device?.coOwnersId?.some((coOwner) => coOwner === user.sub)
    )
      throw new ForbiddenError(
        `Cannot start this session because you are not the owner or co-owner of this device.`,
      );

    const cachedDevice = await this.deviceService.getKVDevice(data.deviceId);

    if (!cachedDevice)
      throw new NotFoundException(
        `Cannot start session because device with ID ${data.deviceId} was not found in KV Store.`,
      );

    if (cachedDevice.status !== DeviceStatus.AVAILABLE)
      throw new UnavailableException('Device is not available.', '403');

    let watchers: (Device & { isControlling: boolean })[] = [];

    if (data.watchers && data.watchers.length > 0) {
      watchers = (
        await Promise.all(
          data.watchers.map(async (watcher) => {
            try {
              const device = await this.deviceService.findDeviceById(
                watcher.id,
              );
              return { ...device, isControlling: watcher.isControlling };
            } catch (error) {
              this.logger.error(
                `Error fetching device with ID ${watcher.id}: ${error.message}`,
              );
              return null;
            }
          }),
        )
      ).filter(Boolean);
    }

    if (!watchers.length)
      throw new BadRequestException('The session has no devices to stream.');

    const session = this.sessionRepository.create({ ...data, watchers });
    const savedSession = await this.sessionRepository.save(session);

    await Promise.all(
      watchers.map(async (watcher) => {
        const watcherKV = await this.deviceService.getKVDevice(watcher.id);

        if (watcherKV) {
          await this.deviceService.upsertKVDevice(watcher.id, {
            ...watcherKV,
            watchingSessions: [...watcherKV.watchingSessions, session.id],
          });
        } else {
          this.logger.warn(
            `[createSession]: Device with ID ${watcher.id} not found in KV Store.`,
          );
        }
      }),
    );

    await this.deviceService.upsertKVDevice(data.deviceId, {
      ...cachedDevice,
      hostingSessions: [...cachedDevice.hostingSessions, savedSession.id],
    });

    await this.jetStream.publish(
      'device:kv:upsert',
      JSON.stringify({ id: data.deviceId }),
    );

    const sessionData = {
      hostId: data.deviceId,
      createdAt: savedSession.createdAt,
      watchers:
        data.watchers?.map((watcher) => ({
          id: watcher.id,
          isControlling: watcher.isControlling,
        })) || [],
    };

    const sessionDataStringified = JSON.stringify(sessionData);

    await this.kvSessions.put(savedSession.id, sessionDataStringified);

    await this.jetStream.publish(
      'sessions:create',
      JSON.stringify({ id: session.id }),
    );

    return savedSession;
  }

  async updateSession(
    id: string,
    data: Omit<UpdateSessionInput, 'watchers'> & { watchers?: Device[] },
  ) {
    await this.sessionRepository.update({ id }, { ...data });

    const updatedSession = await this.findSessionById(id);
    if (!updatedSession) throw new NotFoundException('Session not found.');

    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.sessionRepository.delete({ id });

    if (result.affected) await this.closeSession(id);

    return result.affected > 0;
  }

  async closeSession(id: string): Promise<boolean> {
    try {
      const pubAck: PubAck = await this.jetStream.publish(
        'sessions:stop',
        JSON.stringify({ id }),
      );

      if (pubAck.duplicate) return false;

      return true;
    } catch (error) {
      console.error('Failed to publish message:', error);
      return false;
    }
  }
}
