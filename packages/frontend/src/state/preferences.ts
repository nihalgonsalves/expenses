import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { z } from 'zod';

import { PREFERENCES_DEXIE_TABLE } from '../config';

type KeyValueItem = {
  key: string;
  value: unknown;
};

class PreferencesDexie extends Dexie {
  preferences!: Table<KeyValueItem>;

  constructor() {
    super(PREFERENCES_DEXIE_TABLE);
    this.version(1).stores({
      preferences: 'key',
    });
  }
}

export const prefsDexie = new PreferencesDexie();

const createUsePreference = <T>(key: string, parse: (value: unknown) => T) => {
  const getPreference = async () => {
    const item = await prefsDexie.preferences.get(key);
    return item === undefined ? undefined : parse(item.value);
  };

  const setPreference = async (value: T | undefined) => {
    if (value === undefined) {
      await prefsDexie.preferences.delete(key);
    } else {
      await prefsDexie.preferences.put({ key, value });
    }
  };

  const usePreference = () => {
    const value = useLiveQuery(getPreference);
    return [value, setPreference] as const;
  };

  return [usePreference, getPreference] as const;
};

export const createPreferenceWithDefault = <T>(
  key: string,
  parse: (value: unknown) => T,
  defaultValue: T,
) => {
  const [usePreference, getPreference] = createUsePreference(key, parse);

  const usePreferenceWithDefault = () => {
    const [preference, setPreference] = usePreference();
    return [preference ?? defaultValue, setPreference] as const;
  };

  const getPreferenceWithDefault = async () =>
    (await getPreference()) ?? defaultValue;

  return [usePreferenceWithDefault, getPreferenceWithDefault] as const;
};

export const [usePreferredCurrencyCode] = createPreferenceWithDefault(
  'preferred_currency_code',
  (v) => z.string().length(3).parse(v),
  'EUR',
);

export const [useSubscriptionEndpoint] = createUsePreference(
  'subscription_endpoint',
  (v) => z.string().parse(v),
);
