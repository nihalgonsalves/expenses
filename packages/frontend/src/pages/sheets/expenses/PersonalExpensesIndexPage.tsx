import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionnButton';
import { PersonalSheetExpensesExpandedList } from '../../../components/personal-sheets/PersonalSheetExpenseExpandedList';
import { PersonalSheetParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const PersonalExpensesIndexPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data: personalSheetExpenses } =
    trpc.expense.getPersonalSheetExpenses.useQuery({
      personalSheetId: sheetId,
    });

  if (!personalSheetExpenses) return null;

  return (
    <Root
      title="Expenses"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
    >
      <PersonalSheetExpensesExpandedList
        personalSheetId={sheetId}
        expenses={personalSheetExpenses.expenses}
      />
    </Root>
  );
};
