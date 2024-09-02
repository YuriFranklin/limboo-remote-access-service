import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
