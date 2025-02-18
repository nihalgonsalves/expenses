import { useQueryClient } from "@tanstack/react-query";
import {
  createTRPCContext,
  type TRPCQueryKey,
} from "@trpc/tanstack-react-query";
import { useCallback } from "react";

import type { AppRouter } from "@nihalgonsalves/expenses-backend";

const { TRPCProvider, useTRPC: useTRPCOriginal } =
  createTRPCContext<AppRouter>();

export { TRPCProvider };

export const useTRPC = () => {
  const trpc = useTRPCOriginal();

  const queryClient = useQueryClient();

  const invalidate = useCallback(
    async (...queryKeys: TRPCQueryKey[]) => {
      await Promise.all(
        queryKeys.map(async (queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    [queryClient],
  );

  return { trpc, queryClient, invalidate };
};
