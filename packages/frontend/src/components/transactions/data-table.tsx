"use client";

import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import type { ConvertedTransactionWithSheet } from "../../api/useAllUserTransactions";
import { useBreakpoint } from "../../utils/hooks/useBreakpoint";
import { DataTablePagination } from "../ui/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { DataTableExpandedRow } from "./data-table-expanded-row";
import { DataTableToolbar } from "./data-table-toolbar";

type DataTableProps = {
  columns: ColumnDef<ConvertedTransactionWithSheet>[];
  data: ConvertedTransactionWithSheet[];
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
};

export const ZTransactionFilters = z.object({
  sheetId: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
});

const loadFilters = (
  search: z.infer<typeof ZTransactionFilters>,
): ColumnFiltersState =>
  Object.entries(search).map(([id, value]) => ({
    id,
    value,
  }));

export const DataTable = ({
  columns,
  data,
  dateRange,
  setDateRange,
}: DataTableProps) => {
  const searchParams = useSearch({
    from: "/_auth/",
  });
  const navigate = useNavigate({ from: "/" });

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    type: false,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    loadFilters(searchParams),
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "spentAt", desc: true },
  ]);

  const onColumnFiltersChange = useCallback(
    (
      updaterOrValue:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState),
    ) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnFilters)
          : updaterOrValue;

      setColumnFilters(next);

      void navigate({
        search: (prev) => {
          const valueByKey = ZTransactionFilters.parse(
            Object.fromEntries(next.map((filter) => [filter.id, filter.value])),
          );

          return { ...prev, valueByKey };
        },
      });
    },
    [columnFilters, navigate],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const breakpointSm = useBreakpoint("sm");

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      category: breakpointSm,
      sheetId: breakpointSm,
      spentAt: breakpointSm,
      participants: breakpointSm,
    }));
  }, [breakpointSm]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getVisibleCells();

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      role="button"
                      className="cursor-pointer"
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => {
                        row.toggleExpanded();
                      }}
                    >
                      {cells.map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={cells.length}>
                          <DataTableExpandedRow row={row} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};
