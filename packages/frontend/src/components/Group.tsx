import { DeleteOutline, ListAlt, PlaylistAdd } from '@mui/icons-material';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type GroupSheetByIdResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { RouterLink } from '../router';

import { ExpensesList } from './ExpensesList';
import { PeopleCard } from './PeopleCard';

export const Group = ({ group }: { group: GroupSheetByIdResponse }) => {
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();
  const { data: expensesResponse } = trpc.expense.getExpenses.useQuery({
    groupId: group.id,
    limit: 2,
  });

  const deleteGroup = trpc.sheet.deleteGroup.useMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(group.id);

      void utils.sheet.groupSheetById.invalidate(group.id);
      void utils.sheet.myGroupSheets.invalidate();

      navigate('/groups');
    } catch (e) {
      enqueueSnackbar(
        `Error deleting group: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    }
  };

  return (
    <Stack spacing={2}>
      <PeopleCard groupId={group.id} />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Latest Expenses</Typography>
          <ExpensesList
            groupId={group.id}
            expenses={expensesResponse?.expenses ?? []}
          />
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ListAlt />}
              LinkComponent={RouterLink}
              href={`/groups/${group.id}/expenses`}
            >
              All Expenses ({expensesResponse?.total})
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<PlaylistAdd />}
              LinkComponent={RouterLink}
              href={`/groups/${group.id}/expenses/new`}
            >
              Add Expense
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {deleteConfirm ? (
        <Stack direction="column" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setDeleteConfirm(false);
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Confirm Delete (Irreversible)
          </Button>
        </Stack>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => {
            setDeleteConfirm(true);
          }}
        >
          Delete Group
        </Button>
      )}
    </Stack>
  );
};
