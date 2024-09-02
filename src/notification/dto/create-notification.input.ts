import { registerEnumType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
}

export enum NotificationTypes {
  REQUESTING_PERMISSION = 'REQUESTING_PERMISSION',
}

registerEnumType(NotificationTypes, {
  name: 'NotificationTypes',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
});

export class CreateNotificationInput {
  @IsString()
  @IsNotEmpty({ message: 'Cannot be empty.' })
  recipientId: string;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsEnum(NotificationStatus, {
    message: 'Status must be a valid NotificationStatus value.',
  })
  @IsOptional()
  status?: NotificationStatus;

  @IsEnum(NotificationTypes, {
    message: 'Type must be a valid NotificationTypes value.',
  })
  type: NotificationTypes;

  @IsOptional()
  @IsObject()
  payload?: unknown;

  @IsString()
  @IsOptional()
  content?: string;
}
