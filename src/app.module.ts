import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { DeviceModule } from './device/device.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { SessionModule } from './session/session.module';
import { NatsModule } from './nats/nats.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'development' ? '.env' : null,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'remote_access',
      synchronize: true,
      logging: false,
      entities: ['dist/**/*.entity{.ts,.js}'],
    }),
    DeviceModule,
    SessionModule,
    NatsModule.forRoot([{ name: 'KEYVALUE_DEVICES', storeName: 'devices' }]),
    ClientsModule.register([
      {
        name: 'REMOTE_ACCESS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_HOSTNAME}:${process.env.NATS_PORT}`],
        },
      },
    ]),
  ],
  providers: [],
})
export class AppModule {}
