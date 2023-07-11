import { createHTTPServer } from '@trpc/server/adapters/standalone';

import { config } from './config';
import { createContext } from './context';
import { appRouter } from './router';

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

const { port } = server.listen(config.PORT);

console.log(`Server running at http://localhost:${port ?? '???'}`);
