import { addRxPlugin, createRxDatabase, type RxCollection } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { ZSplitGroup, type SplitGroup } from './types';

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

type RXDBCollections = {
  split_groups: RxCollection<SplitGroup>;
};

export const db = await createRxDatabase<RXDBCollections>({
  name: 'expenses-app',
  storage: getRxStorageDexie(),
  ignoreDuplicate: import.meta.hot != null,
});

await db.addCollections<RXDBCollections>({
  split_groups: {
    // @ts-expect-error zodToJsonSchema without a second param returns type and properties
    schema: {
      version: 0,
      primaryKey: 'id',
      ...zodToJsonSchema(ZSplitGroup),
    },
  },
});
