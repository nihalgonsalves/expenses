import * as Currencies from '@dinero.js/currencies';
import countryToCurrency from 'country-to-currency';
import { type Dinero, dinero, toSnapshot } from 'dinero.js';
import { z } from 'zod';

import { type Money } from '@nihalgonsalves/expenses-backend';

import { getUserLanguage } from './utils';

type Currency = { code: string; base: number; exponent: number };

export const CURRENCY_CODES = Object.keys(Currencies).filter((c) =>
  Intl.supportedValuesOf('currency').includes(c),
);

export const getCurrency = (code: string): Currency => {
  // @ts-expect-error no good way to strongly type the Currencies * import
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Currencies[code] as Currency;
};

// TODO: use IP eventually
export const getDefaultCurrency = () => {
  return z
    .string()
    .catch('EUR')
    .parse(
      countryToCurrency[
        // @ts-expect-error string cannot access const countryToCurrency object
        // not a problem since we provide a fallback
        navigator.language.match(/\w\w-(?<country>[A-Z]*)/)?.groups?.['country']
      ],
    );
};

export const formatCurrency = (
  { amount, scale, currencyCode }: Money,
  options: Pick<Intl.NumberFormatOptions, 'currencyDisplay'> = {},
) => {
  const floatValue = amount / Math.pow(10, scale);

  return new Intl.NumberFormat(getUserLanguage(), {
    ...options,
    style: 'currency',
    currency: currencyCode,
  }).format(floatValue);
};

export const toDinero = (amount: number, currencyCode: string) =>
  dinero({ amount, currency: getCurrency(currencyCode) });

export const toMoney = (money: Dinero<number>): Money => {
  const { amount, scale, currency } = toSnapshot(money);

  return { amount, scale, currencyCode: currency.code };
};
