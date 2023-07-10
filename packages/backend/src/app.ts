import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';

import { config } from './config';
import { publicProcedure, router } from './trpc';

const appRouter = router({
  ping: publicProcedure
    .input(z.string())
    .query(({ input }) => `pong: ${input}`),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(config.PORT);

console.log(`Server running at http://localhost:${config.PORT}`);
