import { Temporal } from '@js-temporal/polyfill';
import { useCallback, useMemo, useState } from 'react';

import { useAllUserTransactions } from '../../api/useAllUserTransactions';
import { AllUserTransactionsList } from '../../components/AllUserTransactionsList';
import { QuickCreateTransactionFAB } from '../../components/expenses/QuickCreateTransactionFAB';
import { shortDateFormatter } from '../../utils/utils';
import { RootLoader } from '../Root';

export const TransactionsIndexPage = () => {
  const [from, setFrom] = useState(
    Temporal.Now.zonedDateTimeISO()
      .with({ day: 1 })
      .round({ smallestUnit: 'day', roundingMode: 'trunc' }),
  );

  const [to, setTo] = useState(
    Temporal.Now.zonedDateTimeISO()
      .add({ months: 1 })
      .with({ day: 1 })
      .round({ smallestUnit: 'day', roundingMode: 'trunc' }),
  );

  const offsetByDuration = useCallback((duration: Temporal.DurationLike) => {
    setFrom((prev) => prev.add(duration));
    setTo((prev) => prev.add(duration));
  }, []);

  const displayPeriod = useMemo(
    () =>
      `${shortDateFormatter.format(from.toInstant().epochMilliseconds)} -
        ${shortDateFormatter.format(
          to.subtract({ seconds: 1 }).toInstant().epochMilliseconds,
        )}`,
    [from, to],
  );

  const result = useAllUserTransactions(from, to.subtract({ seconds: 1 }));

  return (
    <RootLoader
      result={result}
      title="Transactions"
      mainClassName="p-0 md:p-0"
      additionalChildren={<QuickCreateTransactionFAB />}
      render={(data) => (
        <AllUserTransactionsList
          data={data}
          offsetByDuration={offsetByDuration}
          displayPeriod={displayPeriod}
        />
      )}
    />
  );
};
