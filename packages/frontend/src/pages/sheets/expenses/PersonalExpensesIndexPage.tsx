import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { PersonalSheetExpensesExpandedList } from '../../../components/personal-sheets/PersonalSheetExpenseExpandedList';
import { PersonalSheetParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const PersonalExpensesIndexPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const result = trpc.expense.getPersonalSheetTransactions.useQuery({
    personalSheetId: sheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Expenses"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
      render={(personalSheetExpenses) => (
        <PersonalSheetExpensesExpandedList
          personalSheetId={sheetId}
          expenses={personalSheetExpenses.transactions}
        />
      )}
    />
  );
};
