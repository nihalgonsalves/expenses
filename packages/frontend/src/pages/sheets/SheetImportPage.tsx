import { trpc } from '../../api/trpc';
import { PersonalExpenseImportStepper } from '../../components/personal-sheets/PersonalExpenseImportStepper';
import { useParams, PersonalSheetParams } from '../../router';
import { RootLoader } from '../Root';

export const SheetImportPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const result = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <RootLoader
      result={result}
      title="Import Expenses"
      showBackButton
      render={(sheet) => <PersonalExpenseImportStepper personalSheet={sheet} />}
    />
  );
};
