import { Global, Module } from '@nestjs/common';
import { KeycloakConfigService } from './keycloak-config.service';

@Global()
@Module({
  providers: [KeycloakConfigService],
  exports: [KeycloakConfigService],
})
export class KeycloakConfigModule {}
