import {
  Inject,
  Injectable,
  InternalServerErrorException,
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

@Injectable()
export class SessionService implements OnModuleInit {
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

  async findAllSessions(options?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    deviceId?: string;
  }): Promise<[Session[], number]> {
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
    } as FindManyOptions<Session>);

    return [sessions, totalCount];
  }

  async findSessionById(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });

    if (!session) throw new NotFoundException('Session not found.');

    return session;
  }

  async createSession(
    data: Omit<CreateSessionInput, 'watchers'> & { watchers?: Device[] },
  ): Promise<Session> {
    const cachedDevice = (
      await this.kvDevices.get(data.deviceId)
    ).json<CachedDevice>();

    if (!cachedDevice)
      throw new NotFoundException(
        "Cannot starting sessions because device hasn't found.",
      );

    if (cachedDevice.status !== DeviceStatus.AVAILABLE)
      throw new UnavailableException("Devices isn't available.", '403');

    const session = this.sessionRepository.create(data);
    const savedSession = await this.sessionRepository.save(session);

    if (!savedSession)
      throw new InternalServerErrorException(
        'An exception has occurred on server.',
      );

    const sessionData = {
      hostId: data.deviceId,
      createdAt: savedSession.createdAt,
      watchers: data.watchers?.map((watcher) => watcher.id) || [],
    };

    const sessionDataBytes = new TextEncoder().encode(
      JSON.stringify(sessionData),
    );

    await this.kvSessions.put(savedSession.id, sessionDataBytes);

    await this.jetStream.publish('sessions:create', session.id);

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
      const pubAck: PubAck = await this.jetStream.publish('sessions:stop', id);

      if (pubAck.duplicate) return false;

      return true;
    } catch (error) {
      console.error('Failed to publish message:', error);
      return false;
    }
  }
}
