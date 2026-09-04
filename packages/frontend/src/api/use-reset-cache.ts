import { useQueryClient } from "@tanstack/react-query";

import { queryCache } from "#/state/query-cache";

import { useInvalidateRouter } from "./use-invalidate-router";

export const useResetCache = () => {
  const queryClient = useQueryClient();
  const invalidateRouter = useInvalidateRouter();

  return async () => {
    queryClient.clear();
    await queryCache.clear();
    await invalidateRouter();
  };
};
