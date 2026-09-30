import { ENV } from '../env';
import { createFileStore } from './fileStore';
import type { Store } from './types';

let store: Store | null = null;

export async function initStore(): Promise<Store> {
  if (ENV.dbClient === 'oracle') {
    const { createOracleStore } = await import('./oracleStore');
    store = await createOracleStore();
  } else {
    store = createFileStore(ENV.dataDir);
  }
  await store.init();
  return store;
}

export function db(): Store {
  if (!store) throw new Error('Store not initialised');
  return store;
}
