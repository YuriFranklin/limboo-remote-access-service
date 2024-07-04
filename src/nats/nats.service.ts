import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NatsMessageService {
  constructor(
    @Inject('REMOTE_ACCESS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async publishMessage(pattern: string, data: any) {
    await this.client.emit(pattern, data).toPromise();
  }

  async sendMessage(pattern: string, data: any) {
    return this.client.send(pattern, data).toPromise();
  }
}
