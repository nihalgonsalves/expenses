"use client";
"use no memo";

import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { useMutation } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import {
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";

import { useTRPC } from "../../api/trpc";
import type { ConvertedTransactionWithSheet } from "../../api/useAllUserTransactions";
import { ConfirmDialog } from "../form/ConfirmDialog";
import { useDialogControls } from "../form/ResponsiveDialog";
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
  const editDialogControls = useDialogControls();
  const deleteDialogControls = useDialogControls();

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
        dialogProps={editDialogControls}
      />

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this transaction?"
        onConfirm={handleDelete}
        variant="destructive"
        {...deleteDialogControls}
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            editDialogControls.handleSetOpen(true);
          }}
        >
          <PencilIcon className="mr-3 size-3" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            deleteDialogControls.handleSetOpen(true);
          }}
        >
          <Trash2Icon className="mr-3 size-3" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </>
  );
};

const GroupTransactionDropdownContent = ({ row }: DataTableRowActionsProps) => {
  const deleteDialogControls = useDialogControls();

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
    <>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            deleteDialogControls.handleSetOpen(true);
          }}
        >
          <TrashIcon className="mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ConfirmDialog
        confirmLabel="Confirm Delete"
        description="Are you sure you want to delete this transaction?"
        onConfirm={handleDelete}
        variant="destructive"
        {...deleteDialogControls}
      />
    </>
  );
};

export const DataTableRowActions = ({ row }: DataTableRowActionsProps) => (
  // const task = taskSchema.parse(row.original);
  <div className="flex gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        render={
          <Button
            $size="icon"
            $variant="ghost"
            className="data-[state=open]:bg-muted flex p-0"
          >
            <AccessibleIcon label="Open menu">
              <MoreVerticalIcon />
            </AccessibleIcon>
          </Button>
        }
      />
      {row.original.sheetType === "PERSONAL" && (
        <PersonalTransactionDropdownContent row={row} />
      )}
      {row.original.sheetType === "GROUP" && (
        <GroupTransactionDropdownContent row={row} />
      )}
    </DropdownMenu>
  </div>
);
