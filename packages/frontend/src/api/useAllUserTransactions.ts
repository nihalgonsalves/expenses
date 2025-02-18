import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { UndefinedOnPartialDeep } from "type-fest";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type {
  GetAllUserTransactionsInput,
  TransactionWithSheet,
} from "@nihalgonsalves/expenses-shared/types/transaction";

import { useConvertToPreferredCurrency } from "./currencyConversion";
import { useTRPC } from "./trpc";

export type ConvertedTransactionWithSheet = TransactionWithSheet & {
  convertedMoney: Money | undefined;
  sheet: Sheet;
};

export type AllConvertedUserTransactions = ConvertedTransactionWithSheet[];

export const useAllUserTransactions = (
  input: UndefinedOnPartialDeep<Partial<GetAllUserTransactionsInput>>,
) => {
  const { trpc } = useTRPC();
  const enabled = input.fromTimestamp != null && input.toTimestamp != null;

  const {
    data = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    trpc.transaction.getAllUserTransactions.queryOptions(
      {
        ...input,
        fromTimestamp: input.fromTimestamp ?? "",
        toTimestamp: input.toTimestamp ?? "",
      },
      { enabled },
    ),
  );

  const [convertCurrency] = useConvertToPreferredCurrency(
    data.map((transaction) => transaction.money.currencyCode),
  );

  const convertedTransactions = useMemo(
    () =>
      data.map(({ sheet, ...transaction }) => ({
        ...transaction,
        convertedMoney: convertCurrency(transaction.money),
        sheet,
      })),
    [data, convertCurrency],
  );

  return {
    data: convertedTransactions,
    isLoading: enabled ? isLoading : false,
    error,
    refetch,
    dataUpdatedAt,
  };
};
