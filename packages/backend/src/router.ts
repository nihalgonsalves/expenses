import { z } from 'zod';

import { publicProcedure, router } from './trpc';

export const appRouter = router({
  ping: publicProcedure
    .input(z.string())
    .query(({ input }) => `pong: ${input}`),
});

export type AppRouter = typeof appRouter;
