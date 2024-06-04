import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RemoteControlModule } from './remote-control/remote-control.module';

@Module({
  imports: [AuthModule, RemoteControlModule],
})
export class AppModule {}
