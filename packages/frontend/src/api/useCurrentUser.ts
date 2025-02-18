import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "./trpc";

export const useCurrentUser = () => {
  const { trpc } = useTRPC();

  return useQuery(trpc.user.me.queryOptions());
};
