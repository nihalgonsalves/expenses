import { endOfMonth, startOfMonth } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { useAllUserTransactions } from '../../api/useAllUserTransactions';
import { AllUserTransactionsList } from '../../components/AllUserTransactionsList';
import { QuickCreateTransactionFAB } from '../../components/expenses/QuickCreateTransactionFAB';
import { RootLoader } from '../Root';

export const TransactionsIndexPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const result = useAllUserTransactions(dateRange?.from, dateRange?.to);

  return (
    <RootLoader
      result={result}
      title="Transactions"
      mainClassName="p-0 md:p-0"
      additionalChildren={<QuickCreateTransactionFAB />}
      render={(data) => (
        <AllUserTransactionsList
          data={data}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    />
  );
};
