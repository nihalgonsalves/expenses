import { DeleteOutline } from '@mui/icons-material';
import { Stack, Button } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { type ExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';

export const ExpenseActions = ({
  sheetId,
  expense,
  setIsInvalidating,
  onDelete,
}: {
  sheetId: string;
  expense: ExpenseListItem;
  setIsInvalidating: (isInvalidating: boolean) => void;
  onDelete: () => void | Promise<void>;
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const deleteExpense = trpc.expense.deleteExpense.useMutation();

  const handleDelete = async () => {
    try {
      setIsInvalidating(true);

      await deleteExpense.mutateAsync({
        sheetId: sheetId,
        expenseId: expense.id,
      });

      await onDelete();
    } catch (e) {
      setIsInvalidating(false);
      enqueueSnackbar(
        `Error deleting expense: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    }
  };

  return deleteConfirm ? (
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
      Delete
    </Button>
  );
};
