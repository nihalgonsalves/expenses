import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

import { ZCurrencyCode } from "@nihalgonsalves/expenses-shared/money";

import { protectedProcedure, router } from "../../trpc";

// frankfurter would ideally return integer + scale or strings, but
// returns JSON floats. this is unideal, but since the rates are only
// ever up to ~6 decimal places, it works fine for non-accounting purposes
const decimalToScaled = (decimal: number) => {
  const scale = `${decimal}`.split(".")[1]?.length ?? 0;
  const amount = Math.round(decimal * Math.pow(10, scale));

  return { scale, amount };
};

export const currencyConversionRouter = router({
  getSupportedCurrencies: protectedProcedure
    .output(z.array(z.string()))
    .query(async ({ ctx }) => {
      const result = await ctx.frankfurterService.getCurrencies();
      return Object.keys(result);
    }),

  getConversionRate: protectedProcedure
    .input(
      z.object({
        // ISO date-only string
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        from: ZCurrencyCode,
        to: ZCurrencyCode,
      }),
    )
    .output(
      z.object({
        from: ZCurrencyCode,
        to: ZCurrencyCode,
        amount: z.number(),
        scale: z.number(),
      }),
    )
    .query(async ({ ctx, input: { date, from, to } }) => {
      const rate = await ctx.frankfurterService.getConversionRate(
        from,
        to,
        Temporal.PlainDate.from(date),
      );
      return { from, to, ...decimalToScaled(rate) };
    }),
});
