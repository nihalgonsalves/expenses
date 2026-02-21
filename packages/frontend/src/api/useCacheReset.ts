import { useRouter } from "@tanstack/react-router";

import { queryCache } from "../state/queryCache";

export const useResetCache = () => {
  const router = useRouter();

  return async () => {
    await queryCache.clear();
    await router.invalidate();
  };
};
