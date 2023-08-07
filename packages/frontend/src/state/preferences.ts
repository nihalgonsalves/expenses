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

const createUsePreference = (key: string) => {
  const getPreference = async () => prefs.preferences.get(key);

  const setPreference = async (value: string | undefined) => {
    if (value) {
      await prefs.preferences.put({ key, value });
    } else {
      await prefs.preferences.delete(key);
    }
  };

  const usePreference = () => {
    const item = useLiveQuery(getPreference);
    return [item?.value, setPreference] as const;
  };

  return usePreference;
};

export const createPreferenceWithDefault = (
  key: string,
  defaultValue: string,
) => {
  const usePreference = createUsePreference(key);

  const usePreferenceWithDefault = () => {
    const [preference, setPreference] = usePreference();
    return [preference ?? defaultValue, setPreference] as const;
  };

  return usePreferenceWithDefault;
};

export const usePreferredCurrencyCode = createPreferenceWithDefault(
  'preferred_currency_code',
  'EUR',
);

export const useSubscriptionEndpoint = createUsePreference(
  'subscription_endpoint',
);
