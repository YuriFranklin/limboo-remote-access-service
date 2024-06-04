import { Module } from '@nestjs/common';
import { KeycloakConfigModule } from '../keycloak-config/keycloak-config.module';
import {
  AuthGuard,
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
} from 'nest-keycloak-connect';
import { KeycloakConfigService } from 'src/keycloak-config/keycloak-config.service';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [KeycloakConfigModule],
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
})
export class AuthModule {}
