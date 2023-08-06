import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';

import { trpc } from '../../api/trpc';
import { AllUserExpensesList } from '../../components/AllUserExpensesList';
import { RootLoader } from '../Root';
export const ExpensesIndexPage = () => {
  const [from] = useState(
    Temporal.Now.zonedDateTimeISO()
      .subtract({ months: 2 })
      .with({ day: 1 })
      .round('day'),
  );

  const [to] = useState(
    Temporal.Now.zonedDateTimeISO().add({ months: 1 }).with({ day: 1 }),
  );

  const result = trpc.expense.getAllUserExpenses.useQuery({
    fromTimestamp: from.toInstant().toString(),
    toTimestamp: to.toInstant().toString(),
  });

  return (
    <RootLoader
      result={result}
      title="Expenses"
      mainClassName="p-0"
      render={(data) => <AllUserExpensesList data={data} />}
    />
  );
};
