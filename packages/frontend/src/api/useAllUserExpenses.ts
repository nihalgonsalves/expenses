import type { Temporal } from '@js-temporal/polyfill';
import { useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { useConvertToPreferredCurrency } from './currencyConversion';
import { trpc } from './trpc';

export type ConvertedExpenseWithSheet = {
  expense: TransactionListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
};

export type AllConvertedUserExpenses = {
  expenses: ConvertedExpenseWithSheet[];
  earnings: ConvertedExpenseWithSheet[];
};

type AllConvertedUserExpensesQueryResult = Pick<
  ReturnType<typeof trpc.transaction.getAllUserTransactions.useQuery>,
  'error' | 'isLoading' | 'refetch'
> & {
  data: AllConvertedUserExpenses | undefined;
};

export const useAllUserExpenses = (
  from: Temporal.ZonedDateTime,
  to: Temporal.ZonedDateTime,
): AllConvertedUserExpensesQueryResult => {
  const { data, isLoading, error, refetch } =
    trpc.transaction.getAllUserTransactions.useQuery(
      {
        fromTimestamp: from.toInstant().toString(),
        toTimestamp: to.toInstant().toString(),
      },
      {},
    );

  const [convertCurrency] = useConvertToPreferredCurrency([
    ...(data?.expenses.map(
      ({ transaction }) => transaction.money.currencyCode,
    ) ?? []),
    ...(data?.earnings.map(
      ({ transaction }) => transaction.money.currencyCode,
    ) ?? []),
  ]);

  const convertedExpenses = useMemo(
    () =>
      data?.expenses.map(({ sheet, transaction }) => ({
        sheet,
        expense: {
          ...transaction,
          convertedMoney: convertCurrency(transaction.money),
        },
      })),
    [data?.expenses, convertCurrency],
  );

  const convertedEarnings = useMemo(
    () =>
      data?.earnings.map(({ sheet, transaction }) => ({
        sheet,
        expense: {
          ...transaction,
          convertedMoney: convertCurrency(transaction.money),
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
