import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../api/trpc";
import { PersonalTransactionsImporter } from "../../components/personal-sheets/PersonalTransactionsImporter";
import { useParams, SheetParams } from "../../routes";
import { Root } from "../Root";

const SheetImportPage = () => {
  const { trpc } = useTRPC();

  const { sheetId } = useParams(SheetParams);
  const { data } = useQuery(trpc.sheet.personalSheetById.queryOptions(sheetId));

  return (
    <Root title="Import Transactions" showBackButton>
      {data ? <PersonalTransactionsImporter personalSheet={data} /> : null}
    </Root>
  );
};

export default SheetImportPage;
