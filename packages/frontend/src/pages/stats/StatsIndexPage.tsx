import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';

import { useAllUserTransactions } from '../../api/useAllUserTransactions';
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

  const result = useAllUserTransactions(from, to);

  return (
    <RootLoader
      result={result}
      title="Stats"
      mainClassName="p-0"
      render={(data) => <CategoryStats data={data} />}
    />
  );
};
