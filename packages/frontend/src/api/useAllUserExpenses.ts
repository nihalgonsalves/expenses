import type { Temporal } from '@js-temporal/polyfill';
import { useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { ExpenseListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { useConvertToPreferredCurrency } from './currencyConversion';
import { trpc } from './trpc';

export type ConvertedExpenseWithSheet = {
  expense: ExpenseListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
};

export type AllConvertedUserExpenses = {
  expenses: ConvertedExpenseWithSheet[];
  earnings: ConvertedExpenseWithSheet[];
};

type AllConvertedUserExpensesQueryResult = Pick<
  ReturnType<typeof trpc.expense.getAllUserExpenses.useQuery>,
  'error' | 'isLoading' | 'refetch'
> & {
  data: AllConvertedUserExpenses | undefined;
};

export const useAllUserExpenses = (
  from: Temporal.ZonedDateTime,
  to: Temporal.ZonedDateTime,
): AllConvertedUserExpensesQueryResult => {
  const { data, isLoading, error, refetch } =
    trpc.expense.getAllUserExpenses.useQuery(
      {
        fromTimestamp: from.toInstant().toString(),
        toTimestamp: to.toInstant().toString(),
      },
      {},
    );

  const [convertCurrency] = useConvertToPreferredCurrency([
    ...(data?.expenses.map(({ expense }) => expense.money.currencyCode) ?? []),
    ...(data?.earnings.map(({ expense }) => expense.money.currencyCode) ?? []),
  ]);

  const convertedExpenses = useMemo(
    () =>
      data?.expenses.map(({ sheet, expense }) => ({
        sheet,
        expense: {
          ...expense,
          convertedMoney: convertCurrency(expense.money),
        },
      })),
    [data?.expenses, convertCurrency],
  );

  const convertedEarnings = useMemo(
    () =>
      data?.earnings.map(({ sheet, expense }) => ({
        sheet,
        expense: {
          ...expense,
          convertedMoney: convertCurrency(expense.money),
        },
      })),
    [data?.earnings, convertCurrency],
  );

  if (convertedExpenses && convertedEarnings) {
    return {
      data: { expenses: convertedExpenses, earnings: convertedEarnings },
      isLoading,
      error,
      refetch,
    };
  }

  return { data: undefined, isLoading, error, refetch };
};
