import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Session } from './session.entity';
import { CreateSessionInput } from './dto/create-session.input';
import { UpdateSessionInput } from './dto/update-session.input';
import { CachedDevice, Device, DeviceStatus } from 'src/device/device.entity';
import { JetStreamClient, KV, KvOptions, PubAck } from 'nats';
import { NATS_JS, NATS_KV_STORE } from 'src/common/constants/constants';
import { UnavailableException } from '../common/exceptions/unavailable.exception';
import { Between } from 'typeorm';
import { subDays } from 'date-fns';

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
  private kvDevices: KV;

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @Inject(NATS_KV_STORE)
    private kvStore: (name: string, opts?: Partial<KvOptions>) => Promise<KV>,
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
  ) {}

  async onModuleInit() {
    try {
      this.kvSessions = await this.kvStore('sessions');
      this.kvDevices = await this.kvStore('devices');
    } catch (error) {
      console.error('Failed to initialize kvs on sessions module:', error);
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
    data: Omit<CreateSessionInput, 'watchers'> & {
      watchers?: (Device & { isControlling?: boolean })[];
    },
  ): Promise<Session> {
    const cachedDeviceEntry = await this.kvDevices.get(data.deviceId);

    const cachedDevice = cachedDeviceEntry.json<CachedDevice>();

    if (!cachedDevice)
      throw new NotFoundException(
        "Cannot starting sessions because device hasn't found.",
      );

    if (cachedDevice.status !== DeviceStatus.AVAILABLE)
      throw new UnavailableException("Devices isn't available.", '403');

    const session = this.sessionRepository.create(data);
    const savedSession = await this.sessionRepository.save(session);

    const deviceDataBytes = JSON.stringify({
      ...cachedDevice,
      hostingSessions: [...cachedDevice.hostingSessions, savedSession.id],
    });

    await this.kvDevices.put(data.deviceId, deviceDataBytes);

    await this.jetStream.publish(
      'device:kv:upsert',
      JSON.stringify({ id: data.deviceId }),
    );

    if (!savedSession)
      throw new InternalServerErrorException(
        'An exception has occurred on server.',
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
