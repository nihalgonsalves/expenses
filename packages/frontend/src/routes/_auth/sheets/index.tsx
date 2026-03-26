import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { SheetsList } from "../../../components/sheets-list";
import { RootLoader } from "../../../pages/root";

const queryOptions = (context: QueryOptionsContext) =>
  context.trpc.sheet.mySheets.queryOptions({ includeArchived: true });

export const Route = createFileRoute("/_auth/sheets/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc } }) =>
    queryClient.ensureQueryData(queryOptions({ trpc })),
});

function RouteComponent() {
  const { trpc } = useTRPC();
  const result = useQuery(queryOptions({ trpc }));

  return (
    <RootLoader
      result={result}
      title="Sheets"
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
}
