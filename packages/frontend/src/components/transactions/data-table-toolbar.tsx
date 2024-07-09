"use client";

import { Cross2Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import { trpc } from "../../api/trpc";
import { useBreakpoint } from "../../utils/hooks/useBreakpoint";
import { CategoryIcon } from "../CategoryAvatar";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { DataTableViewOptions } from "../ui/data-table-view-options";
import { DateRangePicker } from "../ui/date-range-picker";
import { Input } from "../ui/input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
};

export const DataTableToolbar = <TData,>({
  table,
  dateRange,
  setDateRange,
}: DataTableToolbarProps<TData>) => {
  const breakpointMd = useBreakpoint("md");
  const [open, setIsOpen] = useState(breakpointMd);

  const { data: sheets } = trpc.sheet.mySheets.useQuery({
    includeArchived: false,
  });

  const { data: categories } = trpc.transaction.getCategories.useQuery();

  const isFiltered = table.getState().columnFilters.length > 0;

  const typeColumn = table.getColumn("type");
  const sheetColumn = table.getColumn("sheetId");
  const categoryColumn = table.getColumn("category");

  return (
    <div className="flex flex-col gap-2 lg:flex-row">
      <DateRangePicker
        align="center"
        initialDateFrom={dateRange?.from}
        initialDateTo={dateRange?.to}
        onUpdate={({ range }) => {
          setDateRange(range);
        }}
      />

      <Collapsible
        className="flex flex-col gap-2 lg:flex-row"
        open={breakpointMd || open}
      >
        {!breakpointMd && (
          <CollapsibleTrigger asChild>
            <Button
              $variant="outline"
              className="h-8 w-full justify-start"
              onClick={() => {
                setIsOpen((prev) => !prev);
              }}
            >
              <MixerHorizontalIcon className="mr-2" />
              Filters
            </Button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent className="flex flex-col gap-2 lg:flex-row">
          <Input
            placeholder="Filter description..."
            value={
              z
                .string()
                .optional()
                .parse(table.getColumn("description")?.getFilterValue()) ?? ""
            }
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="h-8 lg:w-[150px] xl:w-[250px]"
          />
          {typeColumn && (
            <DataTableFacetedFilter
              column={typeColumn}
              title="Type"
              options={[
                { label: "Expense", value: "EXPENSE" },
                { label: "Income", value: "INCOME" },
                { label: "Transfer", value: "TRANSFER" },
              ]}
            />
          )}
          {sheetColumn && (
            <DataTableFacetedFilter
              column={sheetColumn}
              title="Sheet"
              options={
                sheets?.map(({ id, name }) => ({
                  label: name,
                  value: id,
                })) ?? []
              }
            />
          )}
          {categoryColumn && (
            <DataTableFacetedFilter
              column={categoryColumn}
              title="Category"
              options={
                categories?.map(({ id }) => ({
                  label: id,
                  value: id,
                  icon: ({ className }) => (
                    <div className={className}>
                      <CategoryIcon category={id} />
                    </div>
                  ),
                })) ?? []
              }
            />
          )}
          {isFiltered && (
            <Button
              $variant="ghost"
              onClick={() => {
                table.resetColumnFilters();
              }}
              className="h-8"
            >
              Reset
              <Cross2Icon className="ml-2 size-4" />
            </Button>
          )}
          <div className="grow" />
          <DataTableViewOptions
            table={table}
            className="justify-start md:justify-center"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
