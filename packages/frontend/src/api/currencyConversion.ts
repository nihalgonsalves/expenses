import { useCallback, useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-backend';

import { convertCurrency } from '../utils/money';

import { trpc } from './trpc';

export const useConvertCurrency = (
  sourceCodes: string[],
  targetCode: string,
) => {
  const rates = trpc.useQueries((t) =>
    sourceCodes
      .filter((s) => s !== targetCode)
      .map((sourceCode) =>
        t.currencyConversion.getConversionRate({
          from: sourceCode,
          to: targetCode,
        }),
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

  return useCallback(
    (sourceSnapshot: Money) => {
      if (sourceSnapshot.currencyCode === targetCode) {
        return sourceSnapshot;
      }

      const rate = sourceRateMap[sourceSnapshot.currencyCode];

      if (!rate) return undefined;

      return convertCurrency(sourceSnapshot, targetCode, rate);
    },
    [sourceRateMap, targetCode],
  );
};

export const useCurrencyConversion = (
  sourceCode: string,
  targetCode: string,
  sourceSnapshot: Money,
) => {
  const { data: supportedCurrencies = [] } =
    trpc.currencyConversion.getSupportedCurrencies.useQuery();

  const { data: rate } = trpc.currencyConversion.getConversionRate.useQuery(
    {
      from: sourceCode,
      to: targetCode,
    },
    { enabled: sourceCode !== targetCode },
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
