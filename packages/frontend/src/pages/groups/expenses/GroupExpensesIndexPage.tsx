import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { GroupSheetExpensesExpandedList } from '../../../components/group-sheets/GroupSheetExpensesExpandedList';
import { GroupParams, useParams } from '../../../router';
import { RootLoader } from '../../Root';

export const GroupExpensesIndexPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const result = trpc.expense.getGroupSheetExpenses.useQuery({
    groupSheetId,
  });

  return (
    <RootLoader
      result={result}
      title="Expenses"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
      render={(groupSheetExpenses) => (
        <GroupSheetExpensesExpandedList
          groupSheetId={groupSheetId}
          expenses={groupSheetExpenses.transactions}
        />
      )}
    />
  );
};
