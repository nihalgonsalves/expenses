import { useQuery } from "@tanstack/react-query";

import { sheetQueries } from "./sheet.functions";
import { notificationQueries } from "./notification.functions";

export const usePrefetchQueries = () => {
  useQuery(sheetQueries.mySheets.queryOptions({ includeArchived: true }));
  useQuery(sheetQueries.mySheets.queryOptions({ includeArchived: false }));
  useQuery(notificationQueries.subscriptions.queryOptions());
  useQuery(notificationQueries.publicKey.queryOptions());
};
