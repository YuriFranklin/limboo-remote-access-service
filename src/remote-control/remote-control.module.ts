import { Module } from '@nestjs/common';
import { RemoteControlGateway } from './remote-control.gateway';
import { RemoteControlService } from './remote-control.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [RemoteControlGateway, RemoteControlService],
  imports: [AuthModule],
  exports: [RemoteControlGateway, RemoteControlService],
})
export class RemoteControlModule {}
