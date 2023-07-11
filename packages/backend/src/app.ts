import { createHTTPServer } from '@trpc/server/adapters/standalone';

import { config } from './config';
import { appRouter } from './router';

const server = createHTTPServer({
  router: appRouter,
});

server.listen(config.PORT);

console.log(`Server running at http://localhost:${config.PORT}`);
