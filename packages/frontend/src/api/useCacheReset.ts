import { useQueryClient } from "@tanstack/react-query";

import { queryCache } from "../state/queryCache";

export const useResetCache = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryCache.clear();
    await queryClient.invalidateQueries();
  };
};
