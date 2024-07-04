import { Module, Global } from '@nestjs/common';
import { connect, JetStreamClient, KvOptions } from 'nats';
import { NATS_JS, NATS_KV_STORE } from '../common/constants/constants';

@Global()
@Module({
  providers: [
    {
      provide: NATS_JS,
      useFactory: async () => {
        const nc = await connect({
          servers: [
            `nats://${process.env.NATS_HOSTNAME}:${process.env.NATS_PORT}`,
          ],
        });
        return nc.jetstream();
      },
    },
    {
      provide: NATS_KV_STORE,
      useFactory: async (js: JetStreamClient) => {
        return async (name: string, opts?: Partial<KvOptions>) => {
          return js.views.kv(name, opts);
        };
      },
      inject: [NATS_JS],
    },
  ],
  exports: [NATS_JS, NATS_KV_STORE],
})
export class NatsModule {}
