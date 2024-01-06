import { Temporal } from '@js-temporal/polyfill';
import { useCallback, useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-shared/money';

import { usePreferredCurrencyCode } from '../state/preferences';
import { convertCurrency } from '../utils/money';
import { durationMilliseconds } from '../utils/temporal';

import { trpc } from './trpc';

export const useSupportedCurrencies = () =>
  trpc.currencyConversion.getSupportedCurrencies.useQuery(undefined, {
    staleTime: durationMilliseconds({ hours: 1 }),
  });

export const useConvertToPreferredCurrency = (sourceCodes: string[]) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  const rates = trpc.useQueries((t) =>
    [
      ...new Set(
        sourceCodes.filter(
          (s) => s !== preferredCurrencyCode && supportedCurrencies.includes(s),
        ),
      ),
    ].map((sourceCode) =>
      t.currencyConversion.getConversionRate(
        {
          date: Temporal.Now.zonedDateTimeISO().toPlainDate().toString(),
          from: sourceCode,
          to: preferredCurrencyCode,
        },
        // theoretically could be Infinity for anything over 3 days ago (to account for weekend rates not updating)
        { staleTime: durationMilliseconds({ minutes: 5 }) },
      ),
    ),
  );

  // Record<SourceCurrency, Rate SourceCurrency->TargetCurrency>>
  const sourceRateMap = useMemo(
    () =>
      Object.fromEntries(
        rates
          .filter(
            (r): r is typeof r & { status: 'success' } =>
              r.status === 'success',
          )
          .map((r) => [r.data.from, r.data]),
      ),
    [rates],
  );

  const convertToPreferred = useCallback(
    (sourceSnapshot: Money) => {
      if (sourceSnapshot.currencyCode === preferredCurrencyCode) {
        return sourceSnapshot;
      }

      const rate = sourceRateMap[sourceSnapshot.currencyCode];

      if (!rate) return undefined;

      return convertCurrency(sourceSnapshot, preferredCurrencyCode, rate);
    },
    [sourceRateMap, preferredCurrencyCode],
  );

  return [convertToPreferred, preferredCurrencyCode] as const;
};

export const useCurrencyConversion = (
  date: Temporal.PlainDate,
  sourceCode: string,
  targetCode: string,
  sourceSnapshot: Money,
) => {
  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  const { data: rate } = trpc.currencyConversion.getConversionRate.useQuery(
    {
      date: date.toString(),
      from: sourceCode,
      to: targetCode,
    },
    {
      enabled: sourceCode !== targetCode,
      // theoretically could be Infinity for anything over 3 days ago (to account for weekend rates not updating)
      staleTime: durationMilliseconds({ minutes: 5 }),
    },
  );

  const targetSnapshot = useMemo(
    () =>
      sourceCode !== targetCode && rate
        ? convertCurrency(sourceSnapshot, targetCode, rate)
        : undefined,
    [rate, sourceCode, targetCode, sourceSnapshot],
  );

  return { supportedCurrencies, rate, targetSnapshot };
};
