import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionResolver } from './session.resolver';
import { DeviceModule } from 'src/device/device.module';
import { Session } from './session.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatsModule } from 'src/nats/nats.module';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [
    DeviceModule,
    AuthModule,
    TypeOrmModule.forFeature([Session]),
    NatsModule,
    LogModule,
  ],
  providers: [SessionService, SessionResolver],
})
export class SessionModule {}
