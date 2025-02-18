import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "./trpc";
import { useCurrentUser } from "./useCurrentUser";

export const usePrefetchQueries = () => {
  const { trpc } = useTRPC();

  const { data: me } = useCurrentUser();
  const enabled = me != null;

  useQuery(
    trpc.sheet.mySheets.queryOptions({ includeArchived: true }, { enabled }),
  );
  useQuery(
    trpc.sheet.mySheets.queryOptions({ includeArchived: false }, { enabled }),
  );

  useQuery(
    trpc.notification.getSubscriptions.queryOptions(undefined, { enabled }),
  );
  useQuery(trpc.notification.getPublicKey.queryOptions(undefined, { enabled }));
};
