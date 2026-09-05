import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { sheetQueries } from "../../../api/sheet.functions";
import { PersonalTransactionsImporter } from "../../../components/personal-sheets/personal-transactions-importer";
import { Root } from "../../../pages/root";

const queryOptions = (sheetId: string) =>
  sheetQueries.personalSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/sheets/$sheetId/import")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { sheetId } }) =>
    queryClient.query({
      ...queryOptions(sheetId),
      staleTime: "static",
    }),
});

function RouteComponent() {
  const { sheetId } = Route.useParams();

  const { data } = useQuery(queryOptions(sheetId));

  return (
    <Root title="Import Transactions" showBackButton>
      {data ? <PersonalTransactionsImporter personalSheet={data} /> : null}
    </Root>
  );
}
