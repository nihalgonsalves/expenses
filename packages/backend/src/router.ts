import { z } from 'zod';

import { currencyConversionRouter } from './service/frankfurter/currencyConversionRouter';
import { notificationRouter } from './service/notification/router';
import { sheetRouter } from './service/sheet/router';
import { transactionRouter } from './service/transaction/router';
import { userRouter } from './service/user/router';
import { publicProcedure, router } from './trpc';
import { getErrorMessage } from './utils/trpcUtils';

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
  transaction: transactionRouter,
  currencyConversion: currencyConversionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
