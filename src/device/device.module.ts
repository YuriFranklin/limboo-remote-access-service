import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DeviceResolver } from './device.resolver';
import { DeviceService } from './device.service';
import { AuthModule } from 'src/auth/auth.module';
import { NatsModule } from 'src/nats/nats.module';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Device]),
    NatsModule,
    LogModule,
  ],
  providers: [DeviceResolver, DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
