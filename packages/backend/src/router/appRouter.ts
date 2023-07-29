import { z } from 'zod';

import { publicProcedure, router } from '../trpc';
import { getErrorMessage } from '../trpcUtils';

import { currencyConversionRouter } from './currencyConversionRouter';
import { expenseRouter } from './expenseRouter';
import { notificationRouter } from './notificationRouter';
import { sheetRouter } from './sheetRouter';
import { userRouter } from './userRouter';

const health = publicProcedure.query(async ({ ctx }) => {
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
});

export const appRouter = router({
  health,
  user: userRouter,
  sheet: sheetRouter,
  expense: expenseRouter,
  currencyConversion: currencyConversionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
