import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import {
  ZGetConversionRateInput,
  getConversionRate as getBackendConversionRate,
  getSupportedCurrencies as getBackendSupportedCurrencies,
} from "@nihalgonsalves/expenses-backend/src/service/frankfurter/currency-conversion-api";

import { withRequiredServerContext } from "../server/context";
import { usePreferredCurrencyCode } from "../state/preferences";
import { convertCurrency } from "../utils/money";
import { durationMilliseconds } from "../utils/temporal";

export const getSupportedCurrencies = createServerFn({ method: "GET" }).handler(
  async () =>
    withRequiredServerContext(async (context) =>
      getBackendSupportedCurrencies(context),
    ),
);

export const getConversionRate = createServerFn({ method: "GET" })
  .validator(ZGetConversionRateInput)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (context) =>
      getBackendConversionRate(context, data),
    ),
  );

type GetConversionRateInput = z.output<typeof ZGetConversionRateInput>;

const supportedCurrenciesQueryKey = () =>
  ["currencyConversion", "getSupportedCurrencies"] as const;

const conversionRateQueryKey = (input: GetConversionRateInput) =>
  ["currencyConversion", "getConversionRate", input] as const;

const supportedCurrenciesQueryOptions = () =>
  queryOptions({
    queryKey: supportedCurrenciesQueryKey(),
    queryFn: async () => getSupportedCurrencies(),
    staleTime: durationMilliseconds({ hours: 1 }),
  });

const conversionRateQueryOptions = (input: GetConversionRateInput) =>
  queryOptions({
    queryKey: conversionRateQueryKey(input),
    queryFn: async () => getConversionRate({ data: input }),
    staleTime: durationMilliseconds({ minutes: 5 }),
  });

export const currencyConversionQueries = {
  supportedCurrencies: {
    queryKey: supportedCurrenciesQueryKey,
    queryOptions: supportedCurrenciesQueryOptions,
  },
  conversionRate: {
    queryKey: conversionRateQueryKey,
    queryOptions: conversionRateQueryOptions,
  },
};

export const useCurrencyOptions = () =>
  useQuery(currencyConversionQueries.supportedCurrencies.queryOptions());

export const useConvertToPreferredCurrency = (sourceCodes: string[]) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const { data: currencyOptions } = useCurrencyOptions();
  const supportedCurrencies = currencyOptions?.supported ?? [];

  const rates = useQueries({
    queries: [
      ...new Set(
        sourceCodes.filter(
          (sourceCode) =>
            sourceCode !== preferredCurrencyCode &&
            supportedCurrencies.includes(sourceCode),
        ),
      ),
    ].map((sourceCode) =>
      currencyConversionQueries.conversionRate.queryOptions({
        date: Temporal.Now.zonedDateTimeISO().toPlainDate().toString(),
        from: sourceCode,
        to: preferredCurrencyCode,
      }),
    ),
  });

  // Record<SourceCurrency, Rate SourceCurrency->TargetCurrency>>
  const sourceRateMap = Object.fromEntries(
    rates
      .filter(
        (r): r is typeof r & { status: "success" } => r.status === "success",
      )
      .map((r) => [r.data.from, r.data]),
  );

  const convertToPreferred = (sourceSnapshot: Money) => {
    if (sourceSnapshot.currencyCode === preferredCurrencyCode) {
      return sourceSnapshot;
    }

    const rate = sourceRateMap[sourceSnapshot.currencyCode];
    if (!rate) return undefined;

    return convertCurrency(sourceSnapshot, preferredCurrencyCode, rate);
  };

  return [convertToPreferred, preferredCurrencyCode] as const;
};

export const useCurrencyConversion = (
  date: Temporal.PlainDate,
  sourceCode: string,
  targetCode: string,
  sourceSnapshot: Money,
) => {
  const { data: currencyOptions } = useCurrencyOptions();
  const supportedCurrencies = currencyOptions?.supported ?? [];

  const { data: rate } = useQuery({
    ...currencyConversionQueries.conversionRate.queryOptions({
      date: date.toString(),
      from: sourceCode,
      to: targetCode,
    }),
    enabled: sourceCode !== targetCode,
  });

  const targetSnapshot =
    sourceCode !== targetCode && rate
      ? convertCurrency(sourceSnapshot, targetCode, rate)
      : undefined;

  return {
    supportedCurrencies,
    frequentCurrencies: currencyOptions?.frequent ?? [],
    rate,
    targetSnapshot,
  };
};
