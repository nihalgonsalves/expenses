import { useMemo } from "react";

import { toMoneyValues } from "./money";

export const useMoneyValues = (rawAmount: number, currencyCode: string) =>
  useMemo(
    () => toMoneyValues(rawAmount, currencyCode),
    [rawAmount, currencyCode],
  );
