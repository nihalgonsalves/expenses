import { useQueries, useQuery } from "@tanstack/react-query";

import type { Money } from "@nihalgonsalves/expenses-shared/money";

import { usePreferredCurrencyCode } from "../state/preferences";
import { convertCurrency } from "../utils/money";
import { durationMilliseconds } from "../utils/temporal";

import { useTRPC } from "./trpc";

export const useSupportedCurrencies = () => {
  const { trpc } = useTRPC();

  return useQuery(
    trpc.currencyConversion.getSupportedCurrencies.queryOptions(undefined, {
      staleTime: durationMilliseconds({ hours: 1 }),
    }),
  );
};

export const useConvertToPreferredCurrency = (sourceCodes: string[]) => {
  const { trpc } = useTRPC();
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  const rates = useQueries({
    queries: [
      ...new Set(
        sourceCodes.filter(
          (s) => s !== preferredCurrencyCode && supportedCurrencies.includes(s),
        ),
      ),
    ].map((sourceCode) =>
      trpc.currencyConversion.getConversionRate.queryOptions(
        {
          date: Temporal.Now.zonedDateTimeISO().toPlainDate().toString(),
          from: sourceCode,
          to: preferredCurrencyCode,
        },
        // theoretically could be Infinity for anything over 3 days ago (to account for weekend rates not updating)
        { staleTime: durationMilliseconds({ minutes: 5 }) },
      ),
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
  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  const { trpc } = useTRPC();
  const { data: rate } = useQuery(
    trpc.currencyConversion.getConversionRate.queryOptions(
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
    ),
  );

  const targetSnapshot =
    sourceCode !== targetCode && rate
      ? convertCurrency(sourceSnapshot, targetCode, rate)
      : undefined;

  return { supportedCurrencies, rate, targetSnapshot };
};
