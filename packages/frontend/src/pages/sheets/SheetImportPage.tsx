import { trpc } from '../../api/trpc';
import { PersonalExpenseImportStepper } from '../../components/personal-sheets/PersonalExpenseImportStepper';
import { useParams, PersonalSheetParams } from '../../router';
import { Root } from '../Root';

export const SheetImportPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data: sheet } = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <Root title="Import Expenses" showBackButton>
      {sheet && <PersonalExpenseImportStepper personalSheet={sheet} />}
    </Root>
  );
};
