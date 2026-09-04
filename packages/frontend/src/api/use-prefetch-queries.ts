import { useQuery } from "@tanstack/react-query";

import { sheetQueries } from "./sheet";
import { notificationQueries } from "./notification";

export const usePrefetchQueries = () => {
  useQuery(sheetQueries.mySheets.queryOptions({ includeArchived: true }));
  useQuery(sheetQueries.mySheets.queryOptions({ includeArchived: false }));
  useQuery(notificationQueries.subscriptions.queryOptions());
  useQuery(notificationQueries.publicKey.queryOptions());
};
