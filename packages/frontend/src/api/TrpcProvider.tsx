import { Temporal } from '@js-temporal/polyfill';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
import Dexie, { type Table } from 'dexie';
import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import { trpc } from './trpc';

const ZData = z.object({
  httpStatus: z.number().optional(),
  zodError: z
    .object({
      formErrors: z.array(z.string()),
      fieldErrors: z.record(z.array(z.string())),
    })
    .nullish(),
});

type CacheItem = {
  key: string;
  value: string;
};

class CacheDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  queryCache!: Table<CacheItem>;

  constructor() {
    super('react-query-cache');
    this.version(1).stores({
      queryCache: '++key, value',
    });
  }
}

export const dexieCache = new CacheDexie();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) =>
      dexieCache.queryCache.get(key).then((item) => item?.value ?? null),
    removeItem: async (key) => dexieCache.queryCache.delete(key),
    setItem: async (key, value) => dexieCache.queryCache.put({ key, value }),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Temporal.Duration.from({ days: 1 }).total('milliseconds'),
      staleTime: Temporal.Duration.from({ minutes: 5 }).total('milliseconds'),
      retry(failureCount, error) {
        if (error instanceof TRPCClientError) {
          const { httpStatus } = ZData.parse(error.data);

          if (
            httpStatus == 400 ||
            httpStatus == 401 ||
            httpStatus == 403 ||
            httpStatus == 404
          )
            return false;

          if (failureCount === 0) {
            toast.error(error.message);
          }
        }

        return failureCount <= 3;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof TRPCClientError) {
          const errorParseResult = ZData.safeParse(error.data);
          if (errorParseResult.success && errorParseResult.data.zodError) {
            const { formErrors, fieldErrors } = errorParseResult.data.zodError;

            toast.error(
              [
                ...formErrors,
                ...Object.entries(fieldErrors).map(
                  ([field, errors]) => `${field}: ${errors.join(', ')}`,
                ),
              ].join('; '),
            );
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error('An unknown error occurred');
        }
      },
    },
  },
});

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: '/api',
          }),
        ],
      }),
    [],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
};
