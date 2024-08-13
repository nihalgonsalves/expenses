import { trpc } from "../../api/trpc";
import { PersonalTransactionsImporter } from "../../components/personal-sheets/PersonalTransactionsImporter";
import { useParams, SheetParams } from "../../routes";
import { Root } from "../Root";

const SheetImportPage = () => {
  const { sheetId } = useParams(SheetParams);
  const { data } = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <Root title="Import Transactions" showBackButton>
      {data ? <PersonalTransactionsImporter personalSheet={data} /> : null}
    </Root>
  );
};

export default SheetImportPage;
