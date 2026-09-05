import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { config } from "../config";
import { isAppError, isNonRetryableAppError } from "./errors";
import { queryCache } from "../state/query-cache";
import { durationMilliseconds } from "../utils/temporal";

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => queryCache.getItem(key),
    removeItem: async (key) => queryCache.removeItem(key),
    setItem: async (key, value) => queryCache.setItem(key, value),
  },
});

export const getQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: durationMilliseconds({ days: 1 }),
        staleTime: 0,
        retry(failureCount, error) {
          if (isAppError(error)) {
            if (isNonRetryableAppError(error)) return false;

            if (failureCount === 0) {
              toast.error(error.message);
            }
          }

          return failureCount <= 3;
        },
      },
      mutations: {
        onError: (error) => {
          toast.error(
            isAppError(error) ? error.message : "An unknown error occurred",
          );
        },
      },
    },
  });

export const QueryProvider = ({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: asyncStoragePersister,
      buster: config.VITE_GIT_COMMIT_SHA,
    }}
  >
    {children}
  </PersistQueryClientProvider>
);
