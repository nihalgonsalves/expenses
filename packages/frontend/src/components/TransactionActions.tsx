import { MdDeleteOutline } from 'react-icons/md';

import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../api/trpc';

import { ConfirmButton } from './form/ConfirmButton';

export const TransactionActions = ({
  sheetId,
  transaction,
  onDelete,
}: {
  sheetId: string;
  transaction: TransactionListItem;
  onDelete: () => Promise<void> | void;
}) => {
  const { mutateAsync: deleteTransaction, isLoading } =
    trpc.transaction.deleteTransaction.useMutation();

  const handleDelete = async () => {
    await deleteTransaction({
      sheetId,
      transactionId: transaction.id,
    });

    await onDelete();
  };

  return (
    <ConfirmButton
      isLoading={isLoading}
      label={
        <>
          <MdDeleteOutline /> Delete Transaction
        </>
      }
      confirmLabel="Confirm Delete (Irreversible)"
      handleConfirmed={handleDelete}
    />
  );
};
