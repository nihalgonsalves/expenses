import { DeleteOutline, PlaylistAdd } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { deleteGroup } from '../db/splitGroup';
import { type SplitGroupDocument } from '../db/types';
import { RouterLink } from '../router';

import { ExpensesList } from './ExpensesList';

export const Group = ({ group }: { group: SplitGroupDocument }) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    await deleteGroup(group);
    navigate('/groups');
  };

  return (
    <>
      {group.name}
      <Stack spacing={2}>
        <ExpensesList group={group} />

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

        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => void handleDelete()}
        >
          Delete Group
        </Button>
      </Stack>
    </>
  );
};
