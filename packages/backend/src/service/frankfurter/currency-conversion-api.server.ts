import { z } from "zod";

import {
  CURRENCY_CODES,
  ZCurrencyCode,
} from "@nihalgonsalves/expenses-shared/money";

import type { ContextObj } from "../../context.ts";

type AuthenticatedContext = Pick<
  ContextObj,
  "frankfurterService" | "sheetService"
> & {
  user: NonNullable<ContextObj["user"]>;
};

export const ZGetConversionRateInput = z.object({
  date: z.iso.date(),
  from: ZCurrencyCode,
  to: ZCurrencyCode,
});

export const ZSupportedCurrenciesResponse = z.object({
  frequent: z.array(z.string()),
  supported: z.array(z.string()),
});

export const ZConversionRateResponse = z.object({
  from: ZCurrencyCode,
  to: ZCurrencyCode,
  amount: z.number(),
  scale: z.number(),
});

// frankfurter would ideally return integer + scale or strings, but
// returns JSON floats. this is unideal, but since the rates are only
// ever up to ~6 decimal places, it works fine for non-accounting purposes
const decimalToScaled = (decimal: number) => {
  const scale = `${decimal}`.split(".")[1]?.length ?? 0;
  const amount = Math.round(decimal * Math.pow(10, scale));

  return { scale, amount };
};

export const getSupportedCurrencies = async (ctx: AuthenticatedContext) => {
  const result = await ctx.frankfurterService.getCurrencies();
  const supported = result
    .map(({ iso_code: isoCode }) => isoCode)
    .filter((isoCode) => CURRENCY_CODES.includes(isoCode))
    .toSorted();
  const frequent = await ctx.sheetService.getFrequentlyUsedCurrencyCodes(
    ctx.user,
    supported,
  );

  return ZSupportedCurrenciesResponse.parse({ frequent, supported });
};

export const getConversionRate = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZGetConversionRateInput>,
) => {
  const { date, from, to } = input;
  const rate = await ctx.frankfurterService.getConversionRate(
    from,
    to,
    Temporal.PlainDate.from(date),
  );
  return ZConversionRateResponse.parse({ from, to, ...decimalToScaled(rate) });
};
