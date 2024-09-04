import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    name: 'REMOTE_ACCESS_SERVICE',
    transport: Transport.NATS,
    options: {
      servers: [`nats://${process.env.NATS_HOSTNAME}:${process.env.NATS_PORT}`],
    },
  });

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  await app.startAllMicroservices();

  await app.listen(3000);
}
bootstrap();
