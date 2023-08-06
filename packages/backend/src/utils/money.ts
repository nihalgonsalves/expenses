// TODO: move to utils package

import * as Currencies from '@dinero.js/currencies';
import { type Dinero, add as dineroAdd, dinero, toSnapshot } from 'dinero.js';
import type { z } from 'zod';

import type { ZMoney } from '../service/expense/types';

export const CURRENCY_CODES = Object.keys(Currencies);

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

export const sumMoney = (
  [firstValue, ...otherValues]: Money[],
  currencyCode: string,
): Money => {
  if (!firstValue) {
    return zeroMoney(currencyCode);
  }

  return dineroToMoney(
    otherValues.reduce(
      (total, val) => dineroAdd(total, moneyToDinero(val)),
      moneyToDinero(firstValue),
    ),
  );
};

export const negateMoney = ({ amount, scale, currencyCode }: Money): Money => ({
  amount: amount === 0 ? amount : -amount,
  scale,
  currencyCode,
});
