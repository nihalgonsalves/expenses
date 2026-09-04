"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, RowData } from "@tanstack/react-table";
import { XIcon, SlidersHorizontalIcon, CalendarClockIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import { sheetQueries } from "../../api/sheet";
import { transactionQueries } from "../../api/transaction";
import { useBreakpoint } from "../../utils/hooks/use-breakpoint";
import { CategoryIcon } from "../category-avatar";
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
import type { TransactionTable } from "./table-features";
import { pluralise } from "#/utils/utils";
import { startOfMonth, endOfMonth } from "date-fns";

type DataTableToolbarProps<TData extends RowData> = {
  table: TransactionTable<TData>;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
};

export const DataTableToolbar = <TData extends RowData>({
  table,
  dateRange,
  setDateRange,
}: DataTableToolbarProps<TData>) => {
  const breakpointLg = useBreakpoint("lg");
  const [isOpen, setIsOpen] = useState(breakpointLg);
  // TODO: make these part of the filters, encapsulate reset / default date logic
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false);

  const { data: sheets } = useQuery(
    sheetQueries.mySheets.queryOptions({ includeArchived: false }),
  );
  const { data: futureTransactions } = useQuery(
    transactionQueries.futureTransactions.queryOptions(),
  );

  const { data: categories } = useQuery(
    transactionQueries.categories.queryOptions(),
  );

  const typeColumn = table.getColumn("type");
  const sheetColumn = table.getColumn("sheetId");
  const categoryColumn = table.getColumn("category");

  return (
    <table.Subscribe selector={(state) => state.columnFilters}>
      {(columnFilters: ColumnFiltersState) => {
        const isFiltered = columnFilters.length > 0 || hasCustomDateRange;
        const descriptionFilter = columnFilters.find(
          (filter) => filter.id === "description",
        )?.value;

        return (
          <div className="flex flex-col gap-2 lg:flex-row">
            <DateRangePicker
              align="center"
              initialDateFrom={dateRange?.from}
              initialDateTo={dateRange?.to}
              onUpdate={({ range }) => {
                setHasCustomDateRange(true);
                setDateRange(range);
              }}
            />

            <Collapsible
              className="flex grow flex-col gap-2 lg:flex-row"
              open={breakpointLg || isOpen}
            >
              {!breakpointLg && (
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-8 w-full justify-start"
                      onClick={() => {
                        setIsOpen((prev) => !prev);
                      }}
                    >
                      <SlidersHorizontalIcon className="mr-2" />
                      Filters
                    </Button>
                  }
                />
              )}
              <CollapsibleContent className="contents lg:flex lg:grow lg:flex-row lg:gap-2">
                <Input
                  placeholder="Filter description…"
                  value={z.string().optional().parse(descriptionFilter) ?? ""}
                  onChange={(event) =>
                    table
                      .getColumn("description")
                      ?.setFilterValue(event.target.value)
                  }
                  className="h-8 lg:w-[150px] xl:w-[250px]"
                />
                {typeColumn ? (
                  <DataTableFacetedFilter
                    column={typeColumn}
                    title="Type"
                    options={[
                      { label: "Expense", value: "EXPENSE" },
                      { label: "Income", value: "INCOME" },
                      { label: "Transfer", value: "TRANSFER" },
                    ]}
                  />
                ) : null}
                {sheetColumn ? (
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
                ) : null}
                {categoryColumn ? (
                  <DataTableFacetedFilter
                    column={categoryColumn}
                    title="Category"
                    options={
                      categories?.map(({ id }) => ({
                        label: id,
                        value: id,
                        icon: (
                          <div className="text-muted-foreground mr-2 size-4">
                            <CategoryIcon category={id} />
                          </div>
                        ),
                      })) ?? []
                    }
                  />
                ) : null}

                <div className="hidden grow lg:block" />

                {isFiltered ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      table.resetColumnFilters();
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      });
                      setHasCustomDateRange(false);
                    }}
                    className="h-8"
                  >
                    Reset
                    <XIcon className="ml-2 size-4" />
                  </Button>
                ) : null}

                <div className="hidden grow lg:block" />

                <DataTableViewOptions
                  table={table}
                  className="h-8 justify-start border-dashed lg:justify-center"
                />
              </CollapsibleContent>
            </Collapsible>

            {futureTransactions?.count != null &&
              futureTransactions.count > 0 && (
                <Button
                  onClick={() => {
                    setHasCustomDateRange(true);
                    setDateRange({
                      from: new Date(),
                      to: futureTransactions.last
                        ? new Date(
                            Temporal.Instant.from(futureTransactions.last)
                              .epochMilliseconds,
                          )
                        : undefined,
                    });
                  }}
                  variant="outline"
                  className="border-primary h-8 justify-start lg:justify-center"
                >
                  <CalendarClockIcon className="mr-0.5 size-[1em]" />
                  {futureTransactions.count} upcoming{" "}
                  {pluralise(
                    futureTransactions.count,
                    "transaction",
                    "transactions",
                  )}
                </Button>
              )}
          </div>
        );
      }}
    </table.Subscribe>
  );
};
