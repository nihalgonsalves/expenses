import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "./trpc";

export const usePrefetchQueries = () => {
  const { trpc } = useTRPC();

  useQuery(trpc.sheet.mySheets.queryOptions({ includeArchived: true }));
  useQuery(trpc.sheet.mySheets.queryOptions({ includeArchived: false }));
  useQuery(trpc.notification.getSubscriptions.queryOptions(undefined));
  useQuery(trpc.notification.getPublicKey.queryOptions(undefined));
};
