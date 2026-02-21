import * as Currencies from "@dinero.js/currencies";
import {
  type Dinero,
  add as dineroAdd,
  dinero,
  toSnapshot,
  equal,
  compare,
} from "dinero.js";
import { z } from "zod";

// hack: avoid ESM/CJS compat things such as `default` and `module.exports`
export const CURRENCY_CODES = Object.keys(Currencies).filter(
  (code) => code.length === 3,
);

export const ZCurrencyCode = z.string().length(3, {
  message: "Currency must be a 3-letter ISO 4217 code",
});

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: ZCurrencyCode,
});

export type Money = z.infer<typeof ZMoney>;

export type Currency = { code: string; base: number; exponent: number };

export const getCurrency = (code: string): Currency =>
  // @ts-expect-error no good way to strongly type the Currencies * import
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  Currencies[code] as Currency;

export const moneyToDinero = ({ amount, scale, currencyCode }: Money) =>
  dinero({
    amount,
    scale,
    currency: getCurrency(currencyCode),
  });

export const dineroToMoney = (money: Dinero<number>): Money => {
  const { amount, scale, currency } = toSnapshot(money);

  return { amount, scale, currencyCode: currency.code };
};

export const zeroMoney = (currencyCode: string): Money => ({
  amount: 0,
  scale: 0,
  currencyCode,
});

export const addMoney = (a: Money, b: Money): Money =>
  dineroToMoney(dineroAdd(moneyToDinero(a), moneyToDinero(b)));

export const sumMoneyOrUndefined = ([firstValue, ...otherValues]: Money[]) => {
  if (!firstValue) {
    return undefined;
  }
  return dineroToMoney(
    otherValues.reduce(
      (total, val) => dineroAdd(total, moneyToDinero(val)),
      moneyToDinero(firstValue),
    ),
  );
};

export const sumMoney = (values: Money[], currencyCode: string): Money =>
  sumMoneyOrUndefined(values) ?? zeroMoney(currencyCode);

export const equalMoney = (a: Money, b: Money) =>
  equal(moneyToDinero(a), moneyToDinero(b));

export const negateMoney = ({ amount, scale, currencyCode }: Money): Money => ({
  amount: amount === 0 ? amount : -amount,
  scale,
  currencyCode,
});

export const compareMoney = (a: Money, b: Money) =>
  compare(moneyToDinero(a), moneyToDinero(b));
