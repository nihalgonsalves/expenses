import { endOfMonth, startOfMonth } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import type { CategoryId } from 'src/data/categories';

import { useAllUserTransactions } from '../../api/useAllUserTransactions';
import { AllUserTransactionsList } from '../../components/AllUserTransactionsList';
import { QuickCreateTransactionFAB } from '../../components/expenses/QuickCreateTransactionFAB';
import { RootLoader } from '../Root';

export const TransactionsIndexPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [category, setCategory] = useState<CategoryId | undefined>();

  const result = useAllUserTransactions(
    dateRange?.from,
    dateRange?.to,
    category,
  );

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
        />
      )}
    />
  );
};
