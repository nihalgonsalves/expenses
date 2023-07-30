import { DeleteOutline } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type GroupSheetByIdResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';

import { GroupSheetExpensesDenseList } from './GroupSheetExpensesDenseList';
import { LatestExpensesCard } from './LatestExpensesCard';
import { PeopleCard } from './PeopleCard';

export const GroupSheet = ({
  groupSheet,
}: {
  groupSheet: GroupSheetByIdResponse;
}) => {
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();
  const { data: groupSheetExpensesResponse } =
    trpc.expense.getGroupSheetExpenses.useQuery({
      groupSheetId: groupSheet.id,
      limit: 2,
    });

  const { mutateAsync: deleteGroupSheet } =
    trpc.sheet.deleteSheet.useMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteGroupSheet(groupSheet.id);

      void utils.sheet.groupSheetById.invalidate(groupSheet.id);
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
      <PeopleCard groupSheetId={groupSheet.id} />

      <LatestExpensesCard
        total={groupSheetExpensesResponse?.total}
        allExpensesPath={`/groups/${groupSheet.id}/expenses`}
        addExpensePath={`/groups/${groupSheet.id}/expenses/new`}
      >
        <GroupSheetExpensesDenseList
          expenses={groupSheetExpensesResponse?.expenses ?? []}
        />
      </LatestExpensesCard>

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
