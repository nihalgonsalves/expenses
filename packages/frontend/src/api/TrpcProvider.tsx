import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
import React, { useMemo } from 'react';
import { z } from 'zod';

import { trpc } from './trpc';

const ZData = z.object({
  httpStatus: z.number().optional(),
});

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry(failureCount, error) {
              if (error instanceof TRPCClientError) {
                const { httpStatus } = ZData.parse(error.data);

                return (
                  httpStatus !== 400 &&
                  httpStatus !== 401 &&
                  httpStatus !== 403 &&
                  httpStatus !== 404
                );
              }

              return failureCount <= 3;
            },
          },
        },
      }),
    [],
  );
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
