import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { KeycloakConfigService } from 'src/keycloak-config/keycloak-config.service';

@Injectable()
export class AuthService {
  private accessToken: string;
  private tokenExpiration: number;
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly keycloakConfigService: KeycloakConfigService) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now() / 1000;

    // Verifica se o token atual ainda é válido
    if (!this.accessToken || this.tokenExpiration <= now) {
      await this.fetchNewAccessToken();
    }

    return this.accessToken;
  }

  private async fetchNewAccessToken(): Promise<void> {
    try {
      const keycloakOptions =
        this.keycloakConfigService.createKeycloakConnectOptions();

      const response = await axios.post(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        `${keycloakOptions.authServerUrl}/realms/${keycloakOptions.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() / 1000 + response.data.expires_in;

      this.logger.log('Access token fetched successfully');
    } catch (error) {
      this.logger.error('Failed to fetch access token', error.message);
      throw new Error('Failed to fetch access token');
    }
  }
}
