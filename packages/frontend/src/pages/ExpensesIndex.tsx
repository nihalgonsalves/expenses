import { PlaylistAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { ExpensesList } from '../components/ExpensesList';
import { useGroup } from '../db/splitGroup';
import { GroupParams, RouterLink, useParams } from '../router';

export const ExpensesIndex = () => {
  const { groupId } = useParams(GroupParams);
  const group = useGroup(groupId);

  if (!group) return null;

  return (
    <>
      <ExpensesList expenses={group.expenses} sx={{ flexGrow: 1 }} />
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<PlaylistAdd />}
        LinkComponent={RouterLink}
        href={`/groups/${group.id}/expenses/new`}
      >
        Add Expense
      </Button>
    </>
  );
};
