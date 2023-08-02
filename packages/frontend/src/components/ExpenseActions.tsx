import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { MdDeleteOutline } from 'react-icons/md';

import { type ExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';

import { ConfirmButton } from './form/ConfirmButton';

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
  const { enqueueSnackbar } = useSnackbar();

  const { mutateAsync: deleteExpense, isLoading } =
    trpc.expense.deleteExpense.useMutation();

  const handleDelete = async () => {
    try {
      setIsInvalidating(true);

      await deleteExpense({
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

  return (
    <ConfirmButton
      isLoading={isLoading}
      label={
        <>
          <MdDeleteOutline /> Delete Expense
        </>
      }
      confirmLabel="Confirm Delete (Irreversible)"
      handleConfirmed={handleDelete}
    />
  );
};
