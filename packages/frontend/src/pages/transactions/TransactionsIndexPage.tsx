import { endOfMonth, startOfMonth } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { useAllUserTransactions } from "../../api/useAllUserTransactions";
import { QuickCreateTransactionFAB } from "../../components/expenses/QuickCreateTransactionFAB";
import { columns } from "../../components/transactions/columns";
import { DataTable } from "../../components/transactions/data-table";
import { RootLoader } from "../Root";

const TransactionsIndexPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const result = useAllUserTransactions({
    fromTimestamp: dateRange?.from?.toISOString(),
    toTimestamp: dateRange?.to?.toISOString(),
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      additionalChildren={<QuickCreateTransactionFAB />}
      render={(data) => (
        <DataTable
          columns={columns}
          data={data}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    />
  );
};

export default TransactionsIndexPage;
