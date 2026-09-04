import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { sheetQueries } from "../../../api/sheet";
import { SheetsList } from "../../../components/sheets-list";
import { RootLoader } from "../../../pages/root";

export const Route = createFileRoute("/_auth/sheets/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) =>
    queryClient.query({
      ...sheetQueries.mySheets.queryOptions({ includeArchived: true }),
      staleTime: "static",
    }),
});

function RouteComponent() {
  const result = useQuery(
    sheetQueries.mySheets.queryOptions({ includeArchived: true }),
  );

  return (
    <RootLoader
      result={result}
      title="Sheets"
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
}
