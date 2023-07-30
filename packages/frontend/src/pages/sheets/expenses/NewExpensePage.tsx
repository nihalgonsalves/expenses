import { trpc } from '../../../api/trpc';
import { CreatePersonalExpenseForm } from '../../../components/CreatePersonalExpenseForm';
import { PersonalSheetParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const NewPersonalSheetExpensePage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data: personalSheet } =
    trpc.sheet.personalSheetById.useQuery(sheetId);

  if (!personalSheet) {
    return null;
  }

  return (
    <Root title="Add Expense" showBackButton>
      <CreatePersonalExpenseForm personalSheet={personalSheet} />
    </Root>
  );
};
