import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';

import { useAllUserExpenses } from '../../api/useAllUserExpenses';
import { CategoryStats } from '../../components/CategoryStats';
import { RootLoader } from '../Root';

export const StatsIndexPage = () => {
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

  const result = useAllUserExpenses(from, to);

  return (
    <RootLoader
      result={result}
      title="Stats"
      mainClassName="p-0"
      render={(data) => <CategoryStats data={data} />}
    />
  );
};