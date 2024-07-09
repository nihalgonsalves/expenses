import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Link } from "react-router-dom";

import {
  addMoney,
  compareMoney,
  type Money,
} from "@nihalgonsalves/expenses-shared/money";

import type {
  AllConvertedUserTransactions,
  ConvertedTransactionWithSheet,
} from "../api/useAllUserTransactions";

import { CategoryIcon } from "./CategoryAvatar";
import { CurrencySpan } from "./CurrencySpan";
import { Button } from "./ui/button";
import { DateRangePicker } from "./ui/date-range-picker";
import { cn } from "./ui/utils";

const getCategorySums = (data: ConvertedTransactionWithSheet[]) => {
  const categorySums: Record<string, Money> = {};

  data.forEach((transaction) => {
    if (!transaction.convertedMoney) return;

    const currentSum = categorySums[transaction.category];

    categorySums[transaction.category] = currentSum
      ? addMoney(currentSum, transaction.convertedMoney)
      : transaction.convertedMoney;
  });

  return categorySums;
};

const CategoryStat = ({ category, sum }: { category: string; sum: Money }) => (
  <div className="bg-card flex place-items-center content-between justify-between rounded-lg border p-6 shadow">
    <div>
      <div className="text-sm capitalize text-neutral-500 md:text-lg">
        <Button $variant="link" className="h-auto p-0" asChild>
          <Link to={`/?${new URLSearchParams({ category }).toString()}`}>
            {category}
          </Link>
        </Button>
      </div>

      <div className="text-base font-bold md:text-3xl">
        <CurrencySpan money={sum} />
      </div>
    </div>

    <div className="text-primary">
      <CategoryIcon category={category} />
    </div>
  </div>
);

export const CategoryStats = ({
  data = [],
  dateRange,
  setDateRange,
}: {
  data: AllConvertedUserTransactions;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
}) => {
  const categoryExpenseSumEntries = useMemo(
    () =>
      Object.entries(
        getCategorySums(
          data.filter((t) => t.type !== "TRANSFER" && t.money.amount < 0),
        ),
      ).sort(([, a], [, b]) => compareMoney(a, b)),
    [data],
  );
  const categoryIncomeSumEntries = useMemo(
    () =>
      Object.entries(
        getCategorySums(
          data.filter((t) => t.type !== "TRANSFER" && t.money.amount > 0),
        ),
      ).sort(([, a], [, b]) => compareMoney(a, b)),
    [data],
  );

  return (
    <>
      <div className="bg-muted mb-4 rounded-md p-1 text-center">
        <DateRangePicker
          initialDateFrom={dateRange?.from}
          initialDateTo={dateRange?.to}
          onUpdate={({ range }) => {
            setDateRange(range);
          }}
        />
      </div>
      <div
        className={cn(
          "grid gap-2 md:gap-4",
          categoryExpenseSumEntries.length > 0 &&
            categoryIncomeSumEntries.length > 0
            ? "grid-cols-2"
            : "grid-cols-1",
        )}
      >
        {categoryExpenseSumEntries.length > 0 && (
          <div className="flex flex-col gap-2 md:gap-4">
            {categoryExpenseSumEntries.map(([category, sum]) => (
              <CategoryStat key={category} category={category} sum={sum} />
            ))}
          </div>
        )}
        {categoryIncomeSumEntries.length > 0 && (
          <div className="flex flex-col gap-2 md:gap-4">
            {categoryIncomeSumEntries.map(([category, sum]) => (
              <CategoryStat key={category} category={category} sum={sum} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
