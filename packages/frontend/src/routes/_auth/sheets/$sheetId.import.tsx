import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { PersonalTransactionsImporter } from "../../../components/personal-sheets/PersonalTransactionsImporter";
import { Root } from "../../../pages/Root";

const queryOptions = (context: QueryOptionsContext, sheetId: string) =>
  context.trpc.sheet.personalSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/sheets/$sheetId/import")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc }, params: { sheetId } }) =>
    queryClient.ensureQueryData(queryOptions({ trpc }, sheetId)),
});

function RouteComponent() {
  const { trpc } = useTRPC();

  const { sheetId } = Route.useParams();

  const { data } = useQuery(queryOptions({ trpc }, sheetId));

  return (
    <Root title="Import Transactions" showBackButton>
      {data ? <PersonalTransactionsImporter personalSheet={data} /> : null}
    </Root>
  );
}
