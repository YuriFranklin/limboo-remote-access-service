import { Global, Module } from '@nestjs/common';
import { KeycloakConfigService } from './keycloak-config.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  providers: [KeycloakConfigService],
  exports: [KeycloakConfigService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'development' ? '.env' : null,
    }),
  ],
})
export class KeycloakConfigModule {}
