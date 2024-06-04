import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RemoteControlService } from './remote-control.service';
import { Roles } from 'nest-keycloak-connect';

@WebSocketGateway()
export class RemoteControlGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly remoteControlService: RemoteControlService) {}

  afterInit(_server: Server) {
    /* console.log('WebSocket initialized'); */
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('control')
  @Roles({ roles: ['admin'] })
  handleControl(@MessageBody() data: string): void {
    this.remoteControlService.handleControl(data);
  }
}
