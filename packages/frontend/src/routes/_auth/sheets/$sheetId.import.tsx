import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC } from "../../../api/trpc";
import { PersonalTransactionsImporter } from "../../../components/personal-sheets/PersonalTransactionsImporter";
import { Root } from "../../../pages/Root";

const SheetImportPage = () => {
  const { trpc } = useTRPC();

  const { sheetId } = Route.useParams();

  const { data } = useQuery(trpc.sheet.personalSheetById.queryOptions(sheetId));

  return (
    <Root title="Import Transactions" showBackButton>
      {data ? <PersonalTransactionsImporter personalSheet={data} /> : null}
    </Root>
  );
};

export const Route = createFileRoute("/_auth/sheets/$sheetId/import")({
  component: SheetImportPage,
});
