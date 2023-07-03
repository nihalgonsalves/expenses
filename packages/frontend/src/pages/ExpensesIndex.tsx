import { PlaylistAdd } from '@mui/icons-material';
import { Fab } from '@mui/material';

import { ExpensesList } from '../components/ExpensesList';
import { useGroup } from '../db/splitGroup';
import { GroupParams, RouterLink, useParams } from '../router';

export const ExpensesIndex = () => {
  const { groupId } = useParams(GroupParams);
  const group = useGroup(groupId);

  if (!group) return null;

  return (
    <>
      <ExpensesList group={group} />
      <Fab
        color="primary"
        aria-label="Add"
        sx={{ position: 'sticky', bottom: 0, right: 0 }}
        LinkComponent={RouterLink}
        href="/expenses/new"
      >
        <PlaylistAdd />
      </Fab>
    </>
  );
};
