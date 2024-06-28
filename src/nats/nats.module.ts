import { Module, DynamicModule, Global } from '@nestjs/common';
import { connect, JetStreamClient, KV } from 'nats';
import { createKeyValueStore } from './nats-keyvalue.factory';

interface KeyValueStoreConfig {
  name: string;
  storeName: string;
}

@Global()
@Module({})
export class NatsModule {
  static forRoot(stores: KeyValueStoreConfig[]): DynamicModule {
    const kvProviders = stores.map((store) => ({
      provide: store.name,
      useFactory: async (js: JetStreamClient): Promise<KV> => {
        return createKeyValueStore(js, store.storeName);
      },
      inject: ['JETSTREAM_CLIENT'],
    }));

    return {
      module: NatsModule,
      providers: [
        {
          provide: 'JETSTREAM_CLIENT',
          useFactory: async (): Promise<JetStreamClient> => {
            const nc = await connect({
              servers: `${process.env.NATS_HOSTNAME}:${process.env.NATS_PORT}`,
            });
            return nc.jetstream();
          },
        },
        ...kvProviders,
      ],
      exports: ['JETSTREAM_CLIENT', ...kvProviders.map((p) => p.provide)],
    };
  }
}
