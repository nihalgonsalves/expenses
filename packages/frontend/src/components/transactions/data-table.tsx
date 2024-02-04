"use client";

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
import { useSearchParams } from "react-router-dom";
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

const ZFilters = z.object({
  sheetId: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
});

const loadFilters = (searchParams: URLSearchParams): ColumnFiltersState => {
  const filters: z.infer<typeof ZFilters> = {
    ...(searchParams.has("sheetId")
      ? { sheetId: searchParams.getAll("sheetId") }
      : {}),
    ...(searchParams.has("category")
      ? { category: searchParams.getAll("category") }
      : {}),
  };

  return Object.entries(filters).map(([id, value]) => ({
    id,
    value,
  }));
};

export const DataTable = ({
  columns,
  data,
  dateRange,
  setDateRange,
}: DataTableProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

      setSearchParams((prev) => {
        const valueByKey = ZFilters.parse(
          Object.fromEntries(next.map((filter) => [filter.id, filter.value])),
        );

        prev.delete("sheetId");
        valueByKey.sheetId?.map((id) => {
          prev.append("sheetId", id);
        });

        prev.delete("category");
        valueByKey.category?.map((id) => {
          prev.append("category", id);
        });

        return prev;
      });
    },
    [columnFilters, setSearchParams],
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

  const breakpointMedium = useBreakpoint("md");

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      category: breakpointMedium,
      sheetId: breakpointMedium,
      spentAt: breakpointMedium,
      participants: breakpointMedium,
    }));
  }, [breakpointMedium]);

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
