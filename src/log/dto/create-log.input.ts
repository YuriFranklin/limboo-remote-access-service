import { LogLevel, EventType } from '../log.entity';

export class CreateLogInput {
  id?: string;
  createdAt?: Date;
  payload: unknown;
  operation: string;
  level: LogLevel;
  userId?: string;
  message?: string;
  eventType?: EventType;
}
