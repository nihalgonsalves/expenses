import { endOfMonth, startOfMonth } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { useAllUserTransactions } from "../../api/useAllUserTransactions";
import { AllUserTransactionsList } from "../../components/AllUserTransactionsList";
import { QuickCreateTransactionFAB } from "../../components/expenses/QuickCreateTransactionFAB";
import { RootLoader } from "../Root";

export const TransactionsIndexPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [sheetId, setSheetId] = useState<string | undefined>(undefined);

  const [category, setCategory] = useState<string | undefined>();

  const result = useAllUserTransactions({
    fromTimestamp: dateRange?.from?.toISOString(),
    toTimestamp: dateRange?.to?.toISOString(),
    sheetId,
    category,
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      additionalChildren={<QuickCreateTransactionFAB />}
      render={(data) => (
        <AllUserTransactionsList
          data={data}
          dateRange={dateRange}
          setDateRange={setDateRange}
          category={category}
          setCategory={setCategory}
          sheetId={sheetId}
          setSheetId={setSheetId}
        />
      )}
    />
  );
};
