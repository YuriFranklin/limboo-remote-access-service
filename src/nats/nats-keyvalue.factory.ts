import { JetStreamClient, KV } from 'nats';

export const createKeyValueStore = async (
  js: JetStreamClient,
  storeName: string,
): Promise<KV> => {
  return await js.views.kv(storeName);
};
