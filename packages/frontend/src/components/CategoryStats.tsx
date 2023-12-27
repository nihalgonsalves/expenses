import type { Temporal } from '@js-temporal/polyfill';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';

import {
  addMoney,
  compareMoney,
  type Money,
} from '@nihalgonsalves/expenses-shared/money';

import type {
  AllConvertedUserTransactions,
  ConvertedTransactionWithSheet,
} from '../api/useAllUserTransactions';
import { categoryById } from '../data/categories';
import { formatCurrency } from '../utils/money';
import { cn } from '../utils/utils';

import { Button } from './ui/button';

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
  offsetByDuration,
  displayPeriod,
}: {
  data: AllConvertedUserTransactions;
  offsetByDuration: (duration: Temporal.DurationLike) => void;
  displayPeriod: string;
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
      <div className="mb-4 flex items-center gap-2 rounded-md bg-muted p-1">
        <Button
          variant="ghost"
          onClick={() => {
            offsetByDuration({ months: -1 });
          }}
        >
          <ArrowLeftIcon />
        </Button>
        <div className="grow text-center">{displayPeriod}</div>
        <Button
          variant="ghost"
          onClick={() => {
            offsetByDuration({ months: 1 });
          }}
        >
          <ArrowRightIcon />
        </Button>
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
                    {categoryById[category]?.name}
                  </div>

                  <div className="text-base font-bold md:text-3xl">
                    {formatCurrency(sum)}
                  </div>
                </div>

                <div className="text-primary">
                  {categoryById[category]?.icon}
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
                    {categoryById[category]?.name}
                  </div>

                  <div className="text-base font-bold md:text-3xl">
                    {formatCurrency(sum)}
                  </div>
                </div>

                <div className="text-primary">
                  {categoryById[category]?.icon}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
