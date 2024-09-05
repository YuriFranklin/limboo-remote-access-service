import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleMatchingMode } from 'nest-keycloak-connect';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { KeycloakConfigService } from 'src/keycloak-config/keycloak-config.service';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { promisify } from 'util';
import { ROLES_KEY } from 'src/common/constants/constants';

@Injectable()
export class CustomRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly keycloakConfigService: KeycloakConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolesOptions = this.reflector.get<RolesOptions>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!rolesOptions) {
      return true;
    }

    const { roles, mode } = rolesOptions;

    if (!roles || !Array.isArray(roles)) {
      return true;
    }

    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth.token;

    if (!token) {
      throw new WsException("Token hasn't provided.");
    }

    try {
      const keycloakOptions =
        this.keycloakConfigService.createKeycloakConnectOptions();
      const clientJWKS = jwksClient({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        jwksUri: `${keycloakOptions.authServerUrl}/${keycloakOptions.realm}/protocol/openid-connect/certs`,
      });

      const getSigningKey = promisify(
        clientJWKS.getSigningKey.bind(clientJWKS),
      );
      const decodedHeader = jwt.decode(token, { complete: true }) as any;
      const key = await getSigningKey(decodedHeader.header.kid);
      const publicKey = key.getPublicKey();
      const decodedToken = jwt.verify(token, publicKey) as any;

      const userRoles = decodedToken.realm_access.roles;

      if (mode === RoleMatchingMode.ALL) {
        const hasAllRoles = roles.every((role) => userRoles.includes(role));
        if (!hasAllRoles) {
          throw new WsException("User doesn't has all required roles.");
        }
      } else if (mode === RoleMatchingMode.ANY) {
        const hasAnyRole = roles.some((role) => userRoles.includes(role));
        if (!hasAnyRole) {
          throw new WsException("User hasn't any required role.");
        }
      }
    } catch (error) {
      console.log(error);
      if (error.name === 'TokenExpiredError') {
        client.emit('authentication_error', 'Expired token.');
        client.disconnect(true);
        // Silently block the request by returning false without logging the error
        return false;
      } else {
        // Rethrow other errors
        throw new WsException('Error on token verify');
      }
    }

    return true;
  }
}

export interface RolesOptions {
  roles: string[];
  mode: RoleMatchingMode;
}

export const Roles = (options: RolesOptions) => SetMetadata(ROLES_KEY, options);
