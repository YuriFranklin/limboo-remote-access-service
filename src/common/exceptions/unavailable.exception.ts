import { HttpException, HttpStatus } from '@nestjs/common';

export class UnavailableException extends HttpException {
  constructor(message: string, errorCode: string) {
    super(
      {
        message,
        errorCode,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
