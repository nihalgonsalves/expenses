import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../../api/trpc';
import { FloatingActionButton } from '../../../components/FloatingActionnButton';
import { GroupSheetExpensesExpandedList } from '../../../components/group-sheets/GroupSheetExpensesExpandedList';
import { GroupParams, useParams } from '../../../router';
import { Root } from '../../Root';

export const GroupExpensesIndexPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const { data: groupSheetExpenses } =
    trpc.expense.getGroupSheetExpenses.useQuery({
      groupSheetId,
    });

  if (!groupSheetExpenses) return null;

  return (
    <Root
      title="Expenses"
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
    >
      <GroupSheetExpensesExpandedList
        groupSheetId={groupSheetId}
        expenses={groupSheetExpenses.expenses}
      />
    </Root>
  );
};
