import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DeviceResolver } from './device.resolver';
import { DeviceService } from './device.service';
import { AuthModule } from 'src/auth/auth.module';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Device]), NatsModule],
  providers: [DeviceResolver, DeviceService],
})
export class DeviceModule {}
