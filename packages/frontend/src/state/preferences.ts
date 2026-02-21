import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { ZCurrencyCode } from "@nihalgonsalves/expenses-shared/money";

import { prefsDb } from "./prefsDb";

const createUsePreference = <T>(key: string, parse: (value: unknown) => T) => {
  const getPreference = async () => {
    const value = await prefsDb.getItem(key);
    return value == null ? null : parse(value);
  };

  const usePreference = () => {
    const { data, refetch } = useQuery({
      queryKey: ["preference", key],
      queryFn: getPreference,
    });

    const setPreference = async (value: T | undefined) => {
      if (value === undefined) {
        await prefsDb.removeItem(key);
      } else {
        await prefsDb.setItem(key, value);
      }
      await refetch();
    };

    return [data, setPreference] as const;
  };

  return usePreference;
};

export const createPreferenceWithDefault = <T>(
  key: string,
  parse: (value: unknown) => T,
  defaultValue: T,
) => {
  const usePreference = createUsePreference(key, parse);

  const usePreferenceWithDefault = () => {
    const [preference, setPreference] = usePreference();
    return [preference ?? defaultValue, setPreference] as const;
  };

  return usePreferenceWithDefault;
};

export const usePreferredCurrencyCode = createPreferenceWithDefault(
  "preferred_currency_code",
  (v) => ZCurrencyCode.parse(v),
  "EUR",
);

export const useSubscriptionEndpoint = createUsePreference(
  "subscription_endpoint",
  (v) => z.string().parse(v),
);
