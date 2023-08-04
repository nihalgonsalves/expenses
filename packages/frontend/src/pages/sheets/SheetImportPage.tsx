import { trpc } from '../../api/trpc';
import { PersonalExpenseImportStepper } from '../../components/personal-sheets/PersonalExpenseImportStepper';
import { useParams, PersonalSheetParams } from '../../router';
import { Root } from '../Root';

export const SheetImportPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data } = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <Root title="Import Expenses" showBackButton>
      {data && <PersonalExpenseImportStepper personalSheet={data} />}
    </Root>
  );
};
