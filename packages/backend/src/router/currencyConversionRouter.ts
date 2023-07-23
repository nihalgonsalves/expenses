import { z } from 'zod';

import { protectedProcedure, router } from '../trpc';

export const currencyConversionRouter = router({
  getSupportedCurrencies: protectedProcedure
    .output(z.array(z.string()))
    .query(async ({ ctx }) => {
      const result = await ctx.frankfurterService.getCurrencies();
      return Object.keys(result);
    }),

  getConversionRate: protectedProcedure
    .input(z.object({ from: z.string().length(3), to: z.string().length(3) }))
    .output(z.object({ amount: z.number(), scale: z.number() }))
    .query(async ({ ctx, input: { from, to } }) => {
      const rate = await ctx.frankfurterService.getConversionRate(from, to);

      // frankfurter would ideally return integer + scale or strings, but
      // returns JSON floats. this is unideal, but since the rates are only
      // ever up to ~6 decimal places, it works fine for non-accounting purposes
      const scale = `${rate}`.split('.')[1]?.length ?? 0;
      const amount = Math.round(rate * Math.pow(10, scale));

      return { amount, scale };
    }),
});
