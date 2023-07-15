import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

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
        message: !IS_PROD && e instanceof Error ? e.message : 'Database Error',
      };
    }
  }),

  user: userRouter,
});

export type AppRouter = typeof appRouter;
