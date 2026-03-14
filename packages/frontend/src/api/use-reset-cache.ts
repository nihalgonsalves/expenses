import { queryCache } from "#/state/query-cache";

import { useInvalidateRouter } from "./use-invalidate-router";

export const useResetCache = () => {
  const invalidateRouter = useInvalidateRouter();

  return async () => {
    await queryCache.clear();
    await invalidateRouter();
  };
};
