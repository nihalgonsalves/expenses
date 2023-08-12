import { MdDeleteOutline } from 'react-icons/md';

import type { ExpenseListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../api/trpc';

import { ConfirmButton } from './form/ConfirmButton';

export const ExpenseActions = ({
  sheetId,
  expense,
  onDelete,
}: {
  sheetId: string;
  expense: ExpenseListItem;
  onDelete: () => Promise<void> | void;
}) => {
  const { mutateAsync: deleteExpense, isLoading } =
    trpc.expense.deleteExpense.useMutation();

  const handleDelete = async () => {
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
