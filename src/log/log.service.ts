import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JetStreamClient, PubAck } from 'nats';
import { NATS_JS } from 'src/common/constants/constants';
import { CreateLogInput } from './dto/create-log.input';
import { Log } from './log.entity';
import { NatsService } from 'src/nats/nats.service';

@Injectable()
export class LogService implements OnModuleInit {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
    private natsService: NatsService,
  ) {}

  async onModuleInit() {
    await this.natsService.ensureStreamExists('log-stream', ['log:create']);
  }

  async createLog(input: CreateLogInput): Promise<boolean> {
    try {
      const log = new Log(input);
      const logData = JSON.stringify(log);

      const pubAck: PubAck = await this.jetStream.publish(
        'log:create',
        Buffer.from(logData),
      );

      if (pubAck.duplicate) return false;

      return true;
    } catch (error) {
      this.logger.error('Failed to publish message on log:', error);
      return false;
    }
  }
}
