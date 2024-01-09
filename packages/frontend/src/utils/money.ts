import { dinero, convert, transformScale, toUnits } from "dinero.js";
import { useMemo } from "react";

import {
  type Money,
  CURRENCY_CODES as BACKEND_CURRENCY_CODES,
  getCurrency,
  dineroToMoney,
  moneyToDinero,
} from "@nihalgonsalves/expenses-shared/money";

import { getUserLanguage } from "./utils";

export const CURRENCY_CODES = BACKEND_CURRENCY_CODES.filter((c) =>
  Intl.supportedValuesOf("currency").includes(c),
);

export const formatCurrency = (
  { amount, scale, currencyCode }: Money,
  options: Pick<
    Intl.NumberFormatOptions,
    "signDisplay" | "currencyDisplay"
  > = {},
) => {
  const floatValue = amount / Math.pow(10, scale);

  return new Intl.NumberFormat(getUserLanguage(), {
    ...options,
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(floatValue);
};

export const toDinero = (amount: number, currencyCode: string) =>
  dinero({ amount, currency: getCurrency(currencyCode) });

export const convertCurrency = (
  source: Money,
  targetCurrencyCode: string,
  targetRate: { amount: number; scale: number },
): Money => {
  const targetCurrency = getCurrency(targetCurrencyCode);

  const convertedDinero = convert(moneyToDinero(source), targetCurrency, {
    [targetCurrencyCode]: targetRate,
  });

  return dineroToMoney(
    transformScale(convertedDinero, targetCurrency.exponent),
  );
};

export const formatDecimalCurrency = (amount: number, currencyCode: string) =>
  formatCurrency(dineroToMoney(toDinero(amount, currencyCode)));

export const toMoneyValues = (rawAmount: number, currencyCode: string) => {
  const dineroValue = toDinero(rawAmount, currencyCode);
  const moneySnapshot = dineroToMoney(dineroValue);

  return [dineroValue, moneySnapshot] as const;
};

export const useMoneyValues = (rawAmount: number, currencyCode: string) =>
  useMemo(
    () => toMoneyValues(rawAmount, currencyCode),
    [rawAmount, currencyCode],
  );

export const moneyToString = ({ currencyCode, amount, scale }: Money) => {
  const unsigned = toUnits(
    moneyToDinero({ currencyCode, amount: Math.abs(amount), scale }),
  )
    .map((val) => val.toFixed(0))
    .join(".");

  return `${amount < 0 ? "-" : ""}${unsigned}`;
};
