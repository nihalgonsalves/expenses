import { trpc } from '../../api/trpc';
import { PersonalTransactionsImporter } from '../../components/personal-sheets/PersonalTransactionsImporter';
import { useParams, PersonalSheetParams } from '../../router';
import { Root } from '../Root';

export const SheetImportPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data } = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <Root title="Import Transactions" showBackButton>
      {data && <PersonalTransactionsImporter personalSheet={data} />}
    </Root>
  );
};
