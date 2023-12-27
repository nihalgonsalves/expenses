import { useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-shared/money';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { useConvertToPreferredCurrency } from './currencyConversion';
import { trpc } from './trpc';

export type ConvertedTransactionWithSheet = {
  transaction: TransactionListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
};

export type AllConvertedUserTransactions = {
  expenses: ConvertedTransactionWithSheet[];
  earnings: ConvertedTransactionWithSheet[];
};

type AllConvertedUserTransactionsQueryResult = Pick<
  ReturnType<typeof trpc.transaction.getAllUserTransactions.useQuery>,
  'error' | 'isLoading' | 'refetch'
> & {
  data: AllConvertedUserTransactions | undefined;
};

export const useAllUserTransactions = (
  from: Date | undefined,
  to: Date | undefined,
): AllConvertedUserTransactionsQueryResult => {
  const enabled = from != null && to != null;

  const {
    data = { expenses: [], earnings: [] },
    isLoading,
    error,
    refetch,
  } = trpc.transaction.getAllUserTransactions.useQuery(
    {
      fromTimestamp: from?.toISOString() ?? '',
      toTimestamp: to?.toISOString() ?? '',
    },
    { enabled },
  );

  const [convertCurrency] = useConvertToPreferredCurrency([
    ...data.expenses.map(({ transaction }) => transaction.money.currencyCode),
    ...data.earnings.map(({ transaction }) => transaction.money.currencyCode),
  ]);

  const convertedExpenses = useMemo(
    () =>
      data.expenses.map(({ sheet, transaction }) => ({
        sheet,
        transaction: {
          ...transaction,
          convertedMoney: convertCurrency(transaction.money),
        },
      })),
    [data.expenses, convertCurrency],
  );

  const convertedEarnings = useMemo(
    () =>
      data.earnings.map(({ sheet, transaction }) => ({
        sheet,
        transaction: {
          ...transaction,
          convertedMoney: convertCurrency(transaction.money),
        },
      })),
    [data.earnings, convertCurrency],
  );

  return {
    data: { expenses: convertedExpenses, earnings: convertedEarnings },
    isLoading: enabled ? isLoading : false,
    error,
    refetch,
  };
};
