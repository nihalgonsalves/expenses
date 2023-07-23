import { z } from 'zod';

import { publicProcedure, router } from '../trpc';
import { getErrorMessage } from '../trpcUtils';

import { currencyConversionRouter } from './currencyConversionRouter';
import { expenseRouter } from './expenseRouter';
import { groupRouter } from './groupRouter';
import { userRouter } from './userRouter';

export const appRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    try {
      const response = await ctx.prisma.$queryRaw`SELECT 1 as one`;

      z.array(z.object({ one: z.literal(1) })).parse(response);

      return { status: 'ok', message: 'healthy' };
    } catch (e) {
      return {
        status: 'error',
        message: getErrorMessage(e),
      };
    }
  }),

  user: userRouter,

  group: groupRouter,

  expense: expenseRouter,

  currencyConversion: currencyConversionRouter,
});

export type AppRouter = typeof appRouter;
