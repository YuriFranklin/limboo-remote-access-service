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
import { CustomRoleGuard } from './custom-role.guard';
import { AuthService } from './auth.service';

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
    {
      provide: APP_GUARD,
      useClass: CustomRoleGuard,
    },
    AuthService,
  ],
  exports: [KeycloakConnectModule, AuthService],
})
export class AuthModule {}
