import { z } from 'zod';

import { config } from './config';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  ping: publicProcedure
    .input(z.string())
    .query(({ input }) => `pong: ${input}`),
  health: publicProcedure.query(async ({ ctx }) => {
    try {
      const response = await ctx.prisma.$queryRaw`SELECT 1 as one`;

      z.array(z.object({ one: z.literal(1) })).parse(response);

      return { status: 'ok', message: 'healthy' };
    } catch (e) {
      return {
        status: 'error',
        message:
          config.NODE_ENV !== 'production' && e instanceof Error
            ? e.message
            : 'database error',
      };
    }
  }),
});

export type AppRouter = typeof appRouter;
