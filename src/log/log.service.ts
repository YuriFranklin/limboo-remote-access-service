import { Inject, Injectable } from '@nestjs/common';
import { JetStreamClient, PubAck } from 'nats';
import { NATS_JS } from 'src/common/constants/constants';
import { CreateLogInput } from './dto/create-log.input';
import { Log } from './log.entity';

@Injectable()
export class LogService {
  constructor(
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
  ) {}

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
      console.error('Failed to publish message on log:', error);
      return false;
    }
  }
}
