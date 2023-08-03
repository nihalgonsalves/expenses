import { useMemo } from 'react';

import type { Money } from '@nihalgonsalves/expenses-backend';

import { convertCurrency } from '../utils/money';

import { trpc } from './trpc';

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
