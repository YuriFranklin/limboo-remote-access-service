export enum LogLevel {
  INFO = 'Info',
  WARN = 'Warn',
  ERROR = 'Error',
}

export enum EventType {
  DELETE = 'delete',
  UPDATE = 'update',
  PATCH = 'patch',
  CREATE = 'create',
  GET = 'get',
  POST = 'post',
}

export class Log {
  id: string;
  createdAt: Date;
  payload: unknown;
  operation: string;
  level: LogLevel;
  userId?: string;
  message?: string;
  eventType?: EventType;

  constructor(data: {
    payload: unknown;
    operation: string;
    level: LogLevel;
    userId?: string;
    message?: string;
    eventType?: EventType;
    id?: string;
    createdAt?: Date;
  }) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.payload = data.payload;
    this.operation = data.operation;
    this.level = data.level;
    this.userId = data.userId;
    this.message = data.message;
    this.eventType = data.eventType;
  }
}
