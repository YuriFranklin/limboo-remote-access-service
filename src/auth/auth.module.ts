import { Module } from '@nestjs/common';
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakConfigService } from '../keycloak-config/keycloak-config.service';
import { KeycloakConfigModule } from '../keycloak-config/keycloak-config.module';

@Module({
  imports: [
    KeycloakConfigModule,
    KeycloakConnectModule.registerAsync({
      useClass: KeycloakConfigService,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  exports: [KeycloakConnectModule],
})
export class AuthModule {}
