import { useMemo } from "react";
import type { UndefinedOnPartialDeep } from "type-fest";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type {
  GetAllUserTransactionsInput,
  TransactionWithSheet,
} from "@nihalgonsalves/expenses-shared/types/transaction";

import { useConvertToPreferredCurrency } from "./currencyConversion";
import { trpc } from "./trpc";

export type ConvertedTransactionWithSheet = TransactionWithSheet & {
  convertedMoney: Money | undefined;
  sheet: Sheet;
};

export type AllConvertedUserTransactions = ConvertedTransactionWithSheet[];

type AllConvertedUserTransactionsQueryResult = Pick<
  ReturnType<typeof trpc.transaction.getAllUserTransactions.useQuery>,
  "error" | "isLoading" | "refetch" | "dataUpdatedAt"
> & {
  data: AllConvertedUserTransactions | undefined;
};

export const useAllUserTransactions = (
  input: UndefinedOnPartialDeep<Partial<GetAllUserTransactionsInput>>,
): AllConvertedUserTransactionsQueryResult => {
  const enabled = input.fromTimestamp != null && input.toTimestamp != null;

  const {
    data = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = trpc.transaction.getAllUserTransactions.useQuery(
    {
      ...input,
      fromTimestamp: input.fromTimestamp ?? "",
      toTimestamp: input.toTimestamp ?? "",
    },
    { enabled },
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
