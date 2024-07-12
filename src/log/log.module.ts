import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
