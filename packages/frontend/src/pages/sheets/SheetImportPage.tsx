import { trpc } from "../../api/trpc";
import { PersonalTransactionsImporter } from "../../components/personal-sheets/PersonalTransactionsImporter";
import { useParams, SheetParams } from "../../router";
import { Root } from "../Root";

export const SheetImportPage = () => {
  const { sheetId } = useParams(SheetParams);
  const { data } = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <Root title="Import Transactions" showBackButton>
      {data && <PersonalTransactionsImporter personalSheet={data} />}
    </Root>
  );
};
