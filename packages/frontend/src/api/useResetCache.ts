import { queryCache } from "#/state/queryCache";

import { useInvalidateRouter } from "./useInvalidateRouter";

export const useResetCache = () => {
  const invalidateRouter = useInvalidateRouter();

  return async () => {
    await queryCache.clear();
    await invalidateRouter();
  };
};
