import Dexie, { type Table } from "dexie";

import { PREFERENCES_DEXIE_TABLE } from "../config";

export type KeyValueItem = {
  key: string;
  value: unknown;
};

class PreferencesDexie extends Dexie {
  preferences!: Table<KeyValueItem, string>;

  constructor() {
    super(PREFERENCES_DEXIE_TABLE);
    this.version(1).stores({
      preferences: "key",
    });
  }
}

export const prefsDexie = new PreferencesDexie();
