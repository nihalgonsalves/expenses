"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import type { ConvertedTransactionWithSheet } from "../../api/useAllUserTransactions";
import { useCurrentUser } from "../../api/useCurrentUser";
import {
  formatDateRelative,
  formatDateTimeRelative,
} from "../../utils/temporal";
import { getTransactionDescription } from "../../utils/utils";
import { AvatarGroup } from "../Avatar";
import { CategoryAvatar, CategoryIcon } from "../CategoryAvatar";
import { CurrencySpan } from "../CurrencySpan";
import { Button } from "../ui/button";
import { DataTableColumnHeader } from "../ui/data-table-column-header";

import { DataTableRowActions } from "./data-table-row-actions";

const columnHelper = createColumnHelper<ConvertedTransactionWithSheet>();

const MeAvatar = () => {
  const { data: me } = useCurrentUser();

  return <AvatarGroup max={1} users={me ? [me] : []} />;
};

const SheetLink = ({
  transaction,
}: {
  transaction: ConvertedTransactionWithSheet;
}) => (
  <Button className="h-[auto] p-0" $variant="link" asChild>
    <Link
      to={
        transaction.sheetType === "PERSONAL"
          ? `/sheets/${transaction.sheet.id}`
          : `/groups/${transaction.sheet.id}`
      }
    >
      {transaction.sheet.name}
    </Link>
  </Button>
);

export const columns = [
  columnHelper.accessor("category", {
    id: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => <CategoryAvatar category={row.original.category} />,
    enableSorting: false,
    filterFn: "arrIncludesSome",
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    filterFn: "arrIncludesSome",
  }),
  columnHelper.accessor("description", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="max-w-[500px] truncate font-medium">
          <span className="mr-1 sm:hidden">
            <CategoryIcon category={row.original.category} />
          </span>
          {getTransactionDescription(row.original)}
        </div>
        <div className="sm:hidden">
          <SheetLink transaction={row.original} />
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("sheet.id", {
    id: "sheetId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sheet" />
    ),
    cell: ({ row }) => <SheetLink transaction={row.original} />,
    filterFn: "arrIncludesSome",
  }),
  columnHelper.accessor("convertedMoney.amount", {
    id: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const money = row.original.convertedMoney ?? row.original.money;

      if (money.amount === 0) {
        return <span>–</span>;
      }

      return (
        <div className="flex flex-col">
          <CurrencySpan
            money={row.original.convertedMoney ?? row.original.money}
            signDisplay={row.original.type === "TRANSFER" ? "never" : "always"}
          />
          <span className="opacity-50 sm:hidden">
            {formatDateRelative(row.original.spentAt)}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("spentAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <span>{formatDateTimeRelative(row.original.spentAt)}</span>
    ),
  }),
  columnHelper.accessor("participants.id", {
    id: "participants",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Participants" />
    ),
    cell: ({ row }) => {
      if (row.original.sheetType === "GROUP") {
        return <AvatarGroup max={3} users={row.original.participants} />;
      }

      return <MeAvatar />;
    },
    enableSorting: false,
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  }),
];
