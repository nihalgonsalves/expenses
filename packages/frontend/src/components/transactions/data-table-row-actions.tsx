"use client";
"use no memo";

import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import {
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";

import { useTRPC } from "../../api/trpc";
import type { ConvertedTransactionWithSheet } from "../../api/useAllUserTransactions";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { EditPersonalTransactionDialog } from "../personal-sheets/EditPersonalTransactionForm";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type DataTableRowActionsProps = {
  row: Row<ConvertedTransactionWithSheet>;
};

const PersonalTransactionDropdownContent = ({
  row,
}: DataTableRowActionsProps) => {
  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: deleteTransaction } = useMutation(
    trpc.transaction.deleteTransaction.mutationOptions(),
  );

  const sheetId = row.original.sheet.id;
  const transactionId = row.original.id;

  const handleDelete = async () => {
    await deleteTransaction({
      sheetId,
      transactionId,
    });

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getPersonalSheetTransactions.queryKey({
        personalSheetId: sheetId,
      }),
    );
  };

  return (
    <>
      <EditPersonalTransactionDialog
        sheetId={sheetId}
        transactionId={transactionId}
        trigger={
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
            }}
          >
            <Pencil1Icon className="mr-2" /> Edit
          </DropdownMenuItem>
        }
      />
      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this transaction?"
        onConfirm={handleDelete}
        variant="destructive"
        trigger={
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
            }}
          >
            <TrashIcon className="mr-2" /> Delete
          </DropdownMenuItem>
        }
      />
    </>
  );
};

const GroupTransactionDropdownContent = ({ row }: DataTableRowActionsProps) => {
  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: deleteTransaction } = useMutation(
    trpc.transaction.deleteTransaction.mutationOptions(),
  );

  const sheetId = row.original.sheet.id;
  const transactionId = row.original.id;

  const handleDelete = async () => {
    await deleteTransaction({
      sheetId,
      transactionId,
    });

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId: sheetId,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(sheetId),
      trpc.transaction.getSimplifiedBalances.queryKey(sheetId),
    );
  };

  return (
    <ConfirmDialog
      confirmLabel="Confirm Delete"
      description="Are you sure you want to delete this transaction?"
      onConfirm={handleDelete}
      variant="destructive"
      trigger={
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <TrashIcon className="mr-2" /> Delete
        </DropdownMenuItem>
      }
    />
  );
};

export const DataTableRowActions = ({ row }: DataTableRowActionsProps) => (
  // const task = taskSchema.parse(row.original);
  <div className="flex gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          $size="icon"
          $variant="ghost"
          className="data-[state=open]:bg-muted flex p-0"
        >
          <AccessibleIcon label="Open menu">
            <DotsVerticalIcon />
          </AccessibleIcon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {row.original.sheetType === "PERSONAL" && (
          <PersonalTransactionDropdownContent row={row} />
        )}
        {row.original.sheetType === "GROUP" && (
          <GroupTransactionDropdownContent row={row} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
