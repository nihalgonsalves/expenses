import { PlaylistAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../../../api/trpc';
import { ExpensesList } from '../../../components/ExpensesList';
import { GroupParams, RouterLink, useParams } from '../../../router';
import { Root } from '../../Root';

export const GroupExpensesIndexPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const { data: groupSheetExpenses } =
    trpc.expense.getGroupSheetExpenses.useQuery({
      groupSheetId,
    });

  if (!groupSheetExpenses) return null;

  return (
    <Root title="Expenses" showBackButton>
      <ExpensesList
        groupSheetId={groupSheetId}
        expenses={groupSheetExpenses.expenses}
        sx={{ flexGrow: 1 }}
        expanded
      />
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<PlaylistAdd />}
        LinkComponent={RouterLink}
        href={`/groups/${groupSheetId}/expenses/new`}
      >
        Add Expense
      </Button>
    </Root>
  );
};
