import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DeviceResolver } from './device.resolver';
import { DeviceService } from './device.service';
import { AuthModule } from 'src/auth/auth.module';
import { NatsModule } from 'src/nats/nats.module';
import { LogModule } from 'src/log/log.module';
import { DeviceController } from './device.controller';
import { RequirementModule } from 'src/requirement/requirement.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Device]),
    NatsModule,
    LogModule,
    RequirementModule,
  ],
  providers: [DeviceResolver, DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
})
export class DeviceModule {}
