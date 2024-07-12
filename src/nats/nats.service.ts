import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JetStreamClient,
  JetStreamManager,
  StreamConfig,
  DiscardPolicy,
  RetentionPolicy,
  StorageType,
} from 'nats';
import { NATS_JS } from '../common/constants/constants';

@Injectable()
export class NatsService {
  private readonly logger = new Logger(NatsService.name);

  constructor(@Inject(NATS_JS) private jetStream: JetStreamClient) {}

  async ensureStreamExists(
    streamName: string,
    subjects: string[],
    configs?: StreamConfig,
  ): Promise<void> {
    try {
      const jsm: JetStreamManager = await this.jetStream.jetstreamManager();
      const streams = await jsm.streams.list().next();

      const streamExists = streams.some(
        (stream) => stream.config.name === streamName,
      );

      if (!streamExists) {
        this.logger.log(`Creating stream: ${streamName}`);
        const streamConfig: StreamConfig = {
          name: streamName,
          subjects,
          retention: RetentionPolicy.Limits,
          max_consumers: 0,
          sealed: false,
          first_seq: 0,
          max_msgs_per_subject: 0,
          max_msgs: 0,
          max_age: 0,
          max_bytes: 0,
          max_msg_size: 0,
          discard: DiscardPolicy.Old,
          duplicate_window: 0,
          allow_rollup_hdrs: false,
          num_replicas: 0,
          deny_delete: false,
          deny_purge: false,
          allow_direct: false,
          mirror_direct: false,
          storage: StorageType.File,
          discard_new_per_subject: false,
          ...configs,
        };
        await jsm.streams.add(streamConfig);
        this.logger.log(`Stream created: ${streamName}`);
      } else {
        this.logger.log(`Stream already exists: ${streamName}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure stream ${streamName} exists: ${error.message}`,
        error.stack,
      );
    }
  }
}
