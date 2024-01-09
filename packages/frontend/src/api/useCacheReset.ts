import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryCache } from "../state/queryCache";

export const useResetCache = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryCache.clear();
    await queryClient.invalidateQueries();
  }, [queryClient]);
};
