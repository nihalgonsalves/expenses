import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

import { PREFERENCES_DEXIE_TABLE } from '../config';

type KeyValueItem = {
  key: string;
  value: string;
};

class PreferencesDexie extends Dexie {
  preferences!: Table<KeyValueItem>;

  constructor() {
    super(PREFERENCES_DEXIE_TABLE);
    this.version(1).stores({
      preferences: '++key, value',
    });
  }
}

const prefs = new PreferencesDexie();

const CURRENCY_CODE_PREFERENCE_KEY = 'preferred_currency_code' as const;

export const usePreferredCurrencyCode = () => {
  const currencyCodeItem = useLiveQuery(async () =>
    prefs.preferences.get(CURRENCY_CODE_PREFERENCE_KEY),
  );

  return [currencyCodeItem?.value ?? 'EUR'] as const;
};
