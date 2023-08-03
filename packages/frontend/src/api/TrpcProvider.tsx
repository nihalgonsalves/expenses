import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
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

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
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
                if (
                  errorParseResult.success &&
                  errorParseResult.data.zodError
                ) {
                  const { formErrors, fieldErrors } =
                    errorParseResult.data.zodError;

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
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
};
