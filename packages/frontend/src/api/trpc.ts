import { useQueryClient } from "@tanstack/react-query";
import type { TRPCClient as TRPCClientOriginal } from "@trpc/client";
import {
  createTRPCContext,
  type TRPCQueryKey,
  type TRPCOptionsProxy as TRPCOptionsProxyOriginal,
} from "@trpc/tanstack-react-query";

import type { AppRouter } from "@nihalgonsalves/expenses-backend";

const { TRPCProvider, useTRPC: useTRPCOriginal } =
  createTRPCContext<AppRouter>();

export { TRPCProvider };

export type TRPCClient = TRPCClientOriginal<AppRouter>;
export type TRPCOptionsProxy = TRPCOptionsProxyOriginal<AppRouter>;

export type QueryOptionsContext = { trpc: TRPCOptionsProxy };

export const useTRPC = () => {
  const trpc = useTRPCOriginal();

  const queryClient = useQueryClient();

  const invalidate = async (...queryKeys: TRPCQueryKey[]) => {
    await Promise.all(
      queryKeys.map(async (queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };

  return { trpc, queryClient, invalidate };
};
