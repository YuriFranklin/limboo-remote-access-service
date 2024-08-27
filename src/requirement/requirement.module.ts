import { Module } from '@nestjs/common';
import { RequirementResolver } from './requirement.resolver';
import { AuthModule } from 'src/auth/auth.module';
import { Requirement } from './requirement.entity';
import { NatsModule } from 'src/nats/nats.module';
import { LogModule } from 'src/log/log.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementService } from './requirement.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [RequirementResolver, RequirementService],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Requirement]),
    NatsModule,
    LogModule,
    ConfigModule,
  ],
})
export class RequirementModule {}
