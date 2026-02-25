"use client";
"use no memo";

import { Link } from "@tanstack/react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

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

const MeAvatar = () => {
  const me = useCurrentUser();

  return <AvatarGroup max={1} users={me ? [me] : []} />;
};

const SheetLink = ({
  transaction,
}: {
  transaction: ConvertedTransactionWithSheet;
}) => (
  <Button
    className="h-auto p-0"
    variant="link"
    role="link"
    nativeButton={false}
    render={
      <Link
        to={
          transaction.sheetType === "PERSONAL"
            ? `/sheets/$sheetId`
            : `/groups/$sheetId`
        }
        params={{
          sheetId: transaction.sheet.id,
        }}
      >
        {transaction.sheet.name}
      </Link>
    }
  />
);
const columnHelper = createColumnHelper<ConvertedTransactionWithSheet>();

// oxlint-disable typescript/no-explicit-any
export const columns: ColumnDef<ConvertedTransactionWithSheet, any>[] = [
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
    id: "type",
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
        <div className="line-clamp-1 max-w-[500px] font-medium">
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
      <DataTableColumnHeader
        className="justify-end"
        column={column}
        title="Amount"
      />
    ),
    invertSorting: true,
    cell: ({ row }) => {
      const money = row.original.convertedMoney ?? row.original.money;

      if (money.amount === 0) {
        return <span className="flex flex-col text-right">–</span>;
      }

      return (
        <div className="flex flex-col text-right">
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
