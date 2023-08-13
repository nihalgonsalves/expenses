import type { Temporal } from '@js-temporal/polyfill';
import { useMemo } from 'react';
import { MdArrowLeft, MdArrowRight } from 'react-icons/md';

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
import { clsxtw } from '../utils/utils';

import { Button } from './form/Button';

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
      <div className="join w-full mb-4">
        <Button
          className="join-item"
          onClick={() => {
            offsetByDuration({ months: -1 });
          }}
        >
          <MdArrowLeft />
        </Button>
        <Button className="join-item flex-grow">{displayPeriod}</Button>
        <Button
          className="join-item"
          onClick={() => {
            offsetByDuration({ months: 1 });
          }}
        >
          <MdArrowRight />
        </Button>
      </div>
      <div
        className={clsxtw(
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
              <div className="stat shadow rounded-lg" key={category}>
                <div className="stat-figure text-secondary">
                  {categoryById[category]?.icon}
                </div>

                <div className="stat-title text-sm md:text-lg">
                  {categoryById[category]?.name}
                </div>
                <div className="stat-value text-base md:text-3xl">
                  {formatCurrency(sum)}
                </div>
              </div>
            ))}
          </div>
        )}
        {categoryIncomeSumEntries.length > 0 && (
          <div className="flex flex-col gap-2 md:gap-4">
            {categoryIncomeSumEntries.map(([category, sum]) => (
              <div className="stat shadow rounded-lg" key={category}>
                <div className="stat-figure text-secondary">
                  {categoryById[category]?.icon}
                </div>

                <div className="stat-title text-sm md:text-lg">
                  {categoryById[category]?.name}
                </div>
                <div className="stat-value text-base md:text-3xl">
                  {formatCurrency(sum)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
