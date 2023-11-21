import { trpc } from '../../../api/trpc';
import { CreatePersonalTransactionForm } from '../../../components/personal-sheets/CreatePersonalTransactionForm';
import { SheetParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const NewPersonalSheetExpensePage = () => {
  const { sheetId } = useParams(SheetParams);
  const { data: personalSheet } =
    trpc.sheet.personalSheetById.useQuery(sheetId);

  if (!personalSheet) {
    return null;
  }

  return (
    <Root title="Add Transaction" showBackButton>
      <CreatePersonalTransactionForm personalSheet={personalSheet} />
    </Root>
  );
};
