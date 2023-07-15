import countryToCurrency from 'country-to-currency';
import { dinero } from 'dinero.js';
import { z } from 'zod';

import {
  type Money,
  CURRENCY_CODES as BACKEND_CURRENCY_CODES,
  getCurrency,
} from '@nihalgonsalves/expenses-backend';

import { getUserLanguage } from './utils';

export const CURRENCY_CODES = BACKEND_CURRENCY_CODES.filter((c) =>
  Intl.supportedValuesOf('currency').includes(c),
);

// TODO: use IP eventually
export const getCurrencyCode = () => {
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
