import { Module } from '@nestjs/common';
import { RemoteControlModule } from './remote-control/remote-control.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, RemoteControlModule],
})
export class AppModule {}
