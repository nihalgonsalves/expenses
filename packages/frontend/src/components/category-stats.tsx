import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import type { CategoryGroup } from "@nihalgonsalves/expenses-shared/types/category-group";
import type { Money } from "@nihalgonsalves/expenses-shared/money";

import type { AllConvertedUserTransactions } from "../api/use-all-user-transactions";
import { getDateRangeSearch } from "../utils/date-range-search";
import { CategoryIcon } from "./category-avatar";
import { getCategoryStats, type CategoryStat } from "./category-stats-utils";
import { CurrencySpan } from "./currency-span";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { DateRangePicker } from "./ui/date-range-picker";

const CategoryLink = ({
  category,
  sum,
  dateRange,
}: CategoryStat & { dateRange: DateRange }) => (
  <Link
    to="/"
    search={{ category: [category], ...getDateRangeSearch(dateRange) }}
    className="hover:bg-muted flex items-center justify-between gap-4 rounded-md px-3 py-2 text-sm"
  >
    <span className="flex items-center gap-2">
      <CategoryIcon category={category} />
      {category}
    </span>
    <CurrencySpan money={sum} />
  </Link>
);

const CategoryGroupStat = ({
  name,
  categories,
  sum,
  dateRange,
}: {
  name: string;
  categories: CategoryStat[];
  sum: Money;
  dateRange: DateRange;
}) => (
  <Collapsible className="bg-card rounded-xl border shadow-sm">
    <div className="flex items-center gap-2 p-4">
      <CollapsibleTrigger
        aria-label={`Toggle ${name}`}
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <ChevronRightIcon className="transition-transform [[data-panel-open]_&]:rotate-90" />
      </CollapsibleTrigger>
      <Link
        to="/"
        search={{
          category: categories.map(({ category }) => category),
          ...getDateRangeSearch(dateRange),
        }}
        className="flex min-w-0 grow items-center justify-between gap-4 font-medium"
      >
        <span className="truncate">{name}</span>
        <CurrencySpan money={sum} />
      </Link>
    </div>
    <CollapsibleContent className="border-t px-2 py-2">
      {categories.map((categoryStat) => (
        <CategoryLink
          key={categoryStat.category}
          {...categoryStat}
          dateRange={dateRange}
        />
      ))}
    </CollapsibleContent>
  </Collapsible>
);

export const CategoryStats = ({
  data,
  categoryGroups,
  dateRange,
  setDateRange,
}: {
  data: AllConvertedUserTransactions;
  categoryGroups: CategoryGroup[];
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange | undefined) => void;
}) => {
  const { groupStats, ungrouped } = getCategoryStats(data, categoryGroups);

  return (
    <>
      <div className="bg-muted mb-4 rounded-md p-1 text-center">
        <DateRangePicker
          initialDateFrom={dateRange.from}
          initialDateTo={dateRange.to}
          onUpdate={({ range }) => {
            setDateRange(range);
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
        {groupStats.map((categoryGroup) => (
          <CategoryGroupStat
            key={categoryGroup.name}
            {...categoryGroup}
            dateRange={dateRange}
          />
        ))}
        {ungrouped.length > 0 && (
          <section className="bg-card rounded-xl border p-4 shadow-sm">
            <h2 className="mb-2 font-medium">Ungrouped</h2>
            <div className="flex flex-col">
              {ungrouped.map((categoryStat) => (
                <CategoryLink
                  key={categoryStat.category}
                  {...categoryStat}
                  dateRange={dateRange}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};
