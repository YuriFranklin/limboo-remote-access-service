import { Injectable } from '@nestjs/common';

@Injectable()
export class RemoteControlService {
  handleControl(data: string): void {
    console.log('Received control data:', data);
  }
}
