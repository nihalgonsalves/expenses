import { PlaylistAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../api/trpc';
import { ExpensesList } from '../components/ExpensesList';
import { GroupParams, RouterLink, useParams } from '../router';

export const ExpensesIndex = () => {
  const { groupId } = useParams(GroupParams);
  const { data: expensesResponse } = trpc.expense.getExpenses.useQuery({
    groupId,
  });

  if (!expensesResponse) return null;

  return (
    <>
      <ExpensesList
        groupId={groupId}
        expenses={expensesResponse.expenses}
        sx={{ flexGrow: 1 }}
        showActions
      />
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<PlaylistAdd />}
        LinkComponent={RouterLink}
        href={`/groups/${groupId}/expenses/new`}
      >
        Add Expense
      </Button>
    </>
  );
};
