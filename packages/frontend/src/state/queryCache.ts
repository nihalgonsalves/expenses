import Dexie, { type Table } from "dexie";

import { REACT_QUERY_CACHE_DEXIE_TABLE } from "../config";

type CacheItem = {
  key: string;
  value: string;
};

class CacheDexie extends Dexie {
  queryCache!: Table<CacheItem, string>;

  constructor() {
    super(REACT_QUERY_CACHE_DEXIE_TABLE);
    this.version(1).stores({
      queryCache: "key",
    });
  }
}

export const queryCache = new CacheDexie().queryCache;
