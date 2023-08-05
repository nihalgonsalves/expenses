import { MdDeleteOutline } from 'react-icons/md';

import type { ExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';

import { ConfirmButton } from './form/ConfirmButton';

export const ExpenseActions = ({
  sheetId,
  expense,
  onBeforeDelete,
  onDelete,
}: {
  sheetId: string;
  expense: ExpenseListItem;
  onBeforeDelete: () => void;
  onDelete: () => Promise<void> | void;
}) => {
  const { mutateAsync: deleteExpense, isLoading } =
    trpc.expense.deleteExpense.useMutation();

  const handleDelete = async () => {
    onBeforeDelete();

    await deleteExpense({
      sheetId,
      expenseId: expense.id,
    });

    await onDelete();
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
