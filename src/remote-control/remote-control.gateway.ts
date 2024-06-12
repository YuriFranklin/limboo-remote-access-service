import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Roles } from 'nest-keycloak-connect';
import { RemoteControlService } from './remote-control.service';
import { UseGuards } from '@nestjs/common';
import { RoleGuard, AuthGuard } from 'nest-keycloak-connect';

@WebSocketGateway()
export class RemoteControlGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly remoteControlService: RemoteControlService) {}

  afterInit(_server: Server) {}

  @UseGuards(AuthGuard)
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @UseGuards(RoleGuard)
  @Roles({ roles: ['admin'] })
  @SubscribeMessage('control')
  handleControl(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.remoteControlService.handleControl(data);
  }
}
