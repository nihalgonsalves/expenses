import { TrashIcon } from "@radix-ui/react-icons";

import type { TransactionListItem } from "@nihalgonsalves/expenses-shared/types/transaction";

import { trpc } from "../api/trpc";

import { ConfirmDialog } from "./form/ConfirmDialog";
import { Button } from "./ui/button";

export const TransactionActions = ({
  sheetId,
  transaction,
  onDelete,
}: {
  sheetId: string;
  transaction: TransactionListItem;
  onDelete: () => Promise<void> | void;
}) => {
  const { mutateAsync: deleteTransaction, isPending } =
    trpc.transaction.deleteTransaction.useMutation();

  const handleDelete = async () => {
    await deleteTransaction({
      sheetId,
      transactionId: transaction.id,
    });

    await onDelete();
  };

  return (
    <ConfirmDialog
      trigger={
        <Button isLoading={isPending} $variant="destructive">
          <TrashIcon className="mr-2" /> Delete Transaction
        </Button>
      }
      variant="destructive"
      confirmLabel="Delete"
      description="Are you sure you want to delete this transaction?"
      onConfirm={handleDelete}
    />
  );
};
