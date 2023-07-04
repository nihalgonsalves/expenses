import {
  addRxPlugin,
  createRxDatabase,
  type RxCollection,
  removeRxDatabase,
  type RxDatabase,
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { getCurrency } from '../money';

import {
  ZSplitGroup,
  type SplitGroup,
  SplitGroupExpenseSplitType,
} from './types';

if (import.meta.env.DEV) {
  const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
  addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBUpdatePlugin);

type RXDBCollections = {
  split_groups: RxCollection<SplitGroup>;
};

const init = async (): Promise<RxDatabase<RXDBCollections>> => {
  try {
    const db = await createRxDatabase<RXDBCollections>({
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

    return db;
  } catch (e) {
    // @ts-expect-error RxError instance is not exported
    if (import.meta.env.DEV && e.rxdb && e.code === 'DB6') {
      await removeRxDatabase('expenses-app', getRxStorageDexie());
      return init();
    }
    throw e;
  }
};

export const db = await init();

if (import.meta.env.DEV) {
  const testGroup = await db.split_groups.findOne('test-group').exec();

  if (!testGroup) {
    await db.split_groups.insert({
      id: 'test-group',
      name: 'Test',
      owner: { id: 'uuid-amy', name: 'Amy' },
      participants: [{ id: 'uuid-taylor', name: 'Taylor' }],
      createdAt: 0,
      currency: 'EUR',
      expenses: [
        {
          id: 'test-expense',
          paidById: 'uuid-amy',
          createdAt: 0,
          spentAt: 0,
          money: { amount: 100, scale: 2, currency: getCurrency('EUR') },
          category: 'food',
          notes: 'Dinner',
          splitType: SplitGroupExpenseSplitType.Equal,
          splits: [
            {
              participantId: 'uuid-amy',
              share: { amount: 50, scale: 2, currency: getCurrency('EUR') },
            },
            {
              participantId: 'uuid-taylor',
              share: { amount: 50, scale: 2, currency: getCurrency('EUR') },
            },
          ],
        },
      ],
    });
  }
}
