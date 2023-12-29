import { CalendarIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';

import {
  addMoney,
  compareMoney,
  type Money,
} from '@nihalgonsalves/expenses-shared/money';

import type {
  AllConvertedUserTransactions,
  ConvertedTransactionWithSheet,
} from '../api/useAllUserTransactions';
import { formatCurrency } from '../utils/money';
import { shortDateFormatter } from '../utils/utils';

import { CategoryIcon } from './CategoryAvatar';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';

const getCategorySums = (data: ConvertedTransactionWithSheet[]) => {
  const categorySums: Record<string, Money> = {};

  data.forEach(({ transaction }) => {
    if (!transaction.convertedMoney) return;

    const currentSum = categorySums[transaction.category];

    categorySums[transaction.category] = currentSum
      ? addMoney(currentSum, transaction.convertedMoney)
      : transaction.convertedMoney;
  });

  return categorySums;
};

export const CategoryStats = ({
  data,
  dateRange,
  setDateRange,
}: {
  data: AllConvertedUserTransactions;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
}) => {
  const categoryExpenseSumEntries = useMemo(
    () =>
      Object.entries(getCategorySums(data.expenses)).sort(([, a], [, b]) =>
        compareMoney(a, b),
      ),
    [data.expenses],
  );
  const categoryIncomeSumEntries = useMemo(
    () =>
      Object.entries(getCategorySums(data.earnings)).sort(([, a], [, b]) =>
        compareMoney(a, b),
      ),
    [data.earnings],
  );

  return (
    <>
      <div className="mb-4 rounded-md bg-muted p-1 text-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 size-4" />
              {dateRange?.from && dateRange.to ? (
                <>
                  {shortDateFormatter.format(dateRange.from)} -{' '}
                  {shortDateFormatter.format(dateRange.to)}
                </>
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div
        className={cn(
          'grid gap-2 md:gap-4',
          categoryExpenseSumEntries.length > 0 &&
            categoryIncomeSumEntries.length > 0
            ? 'grid-cols-2'
            : 'grid-cols-1',
        )}
      >
        {categoryExpenseSumEntries.length > 0 && (
          <div className="flex flex-col gap-2 md:gap-4">
            {categoryExpenseSumEntries.map(([category, sum]) => (
              <div
                className="flex place-items-center content-between justify-between rounded-lg p-6 shadow"
                key={category}
              >
                <div>
                  <div className="text-sm capitalize text-neutral-500 md:text-lg">
                    {category}
                  </div>

                  <div className="text-base font-bold md:text-3xl">
                    {formatCurrency(sum)}
                  </div>
                </div>

                <div className="text-primary">
                  <CategoryIcon category={category} />
                </div>
              </div>
            ))}
          </div>
        )}
        {categoryIncomeSumEntries.length > 0 && (
          <div className="flex flex-col gap-2 md:gap-4">
            {categoryIncomeSumEntries.map(([category, sum]) => (
              <div
                className="flex place-items-center content-between justify-between rounded-lg p-6 shadow"
                key={category}
              >
                <div>
                  <div className="text-sm capitalize text-neutral-500 md:text-lg">
                    {category}
                  </div>

                  <div className="text-base font-bold md:text-3xl">
                    {formatCurrency(sum)}
                  </div>
                </div>

                <div className="text-primary">
                  <CategoryIcon category={category} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
