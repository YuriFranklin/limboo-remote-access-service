import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient, PubAck } from 'nats';
import { NATS_JS } from 'src/common/constants/constants';
import { NatsService } from 'src/nats/nats.service';
import { CreateNotificationInput } from './dto/create-notification.input';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NATS_JS)
    private jetStream: JetStreamClient,
    private readonly natsService: NatsService,
  ) {}

  async onModuleInit() {
    await this.natsService.ensureStreamExists('notifications-stream', [
      'notifications:create',
      'notifications:update',
    ]);
  }

  async createNotification(data: CreateNotificationInput): Promise<boolean> {
    try {
      const dataStringfied = JSON.stringify(data);

      console.log(data);

      console.log(dataStringfied);

      const pubAck: PubAck = await this.jetStream.publish(
        'notifications:create',
        dataStringfied,
      );

      if (pubAck.duplicate) return false;

      return true;
    } catch (error) {
      this.logger.error('Failed to publish message on notification:', error);
      return false;
    }
  }
}
