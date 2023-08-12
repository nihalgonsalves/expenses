import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';

import { useAllUserTransactions } from '../../api/useAllUserTransactions';
import { AllUserTransactionsList } from '../../components/AllUserTransactionsList';
import { RootLoader } from '../Root';

export const ExpensesIndexPage = () => {
  const [from] = useState(
    Temporal.Now.zonedDateTimeISO()
      .with({ day: 1 })
      .round({ smallestUnit: 'day', roundingMode: 'trunc' }),
  );

  const [to] = useState(
    Temporal.Now.zonedDateTimeISO()
      .add({ months: 1 })
      .with({ day: 1 })
      .round({ smallestUnit: 'day', roundingMode: 'trunc' }),
  );

  const result = useAllUserTransactions(from, to);

  return (
    <RootLoader
      result={result}
      title="Expenses"
      mainClassName="p-0"
      render={(data) => <AllUserTransactionsList data={data} />}
    />
  );
};
