import { Temporal } from '@js-temporal/polyfill';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import { queryCache } from '../state/queryCache';

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

const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) =>
      queryCache.get(key).then((item) => item?.value ?? null),
    removeItem: async (key) => queryCache.delete(key),
    setItem: async (key, value) => queryCache.put({ key, value }),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Temporal.Duration.from({ days: 1 }).total('milliseconds'),
      staleTime: Temporal.Duration.from({ minutes: 5 }).total('milliseconds'),
      retry(failureCount, error) {
        if (error instanceof TRPCClientError) {
          const result = ZData.safeParse(error.data);

          if (
            result.success &&
            (result.data.httpStatus == 400 ||
              result.data.httpStatus == 401 ||
              result.data.httpStatus == 403 ||
              result.data.httpStatus == 404)
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
