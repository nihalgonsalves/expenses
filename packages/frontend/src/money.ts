import * as Currencies from '@dinero.js/currencies';
import countryToCurrency from 'country-to-currency';
import { dinero, toSnapshot } from 'dinero.js';
import { type DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ZDineroSnapshot, type DineroSnapshot } from './db/types';
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

export const formatCurrency = ({ amount, scale, currency }: DineroSnapshot) => {
  const floatValue = amount / Math.pow(10, scale);

  return new Intl.NumberFormat(getUserLanguage(), {
    style: 'currency',
    currency: currency.code,
  }).format(floatValue);
};

export const toMoneySnapshot = (amount: number, currencyCode: string) => {
  const d = dinero({ amount, currency: getCurrency(currencyCode) });

  // This is a little weird: dinero.js usually uses readonly types,
  // but this causes problems with Zod, and in turn rxdb's types.
  // So we re-parse the snapshot to get the type, but also use
  // satisfies to make sure it's structurally compatible, readonly aside
  return ZDineroSnapshot.parse(
    toSnapshot(d) satisfies DeepReadonly<DineroSnapshot>,
  );
};
