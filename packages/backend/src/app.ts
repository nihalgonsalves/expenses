import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { PrismaClient } from '@prisma/client';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import IORedis from 'ioredis';

import { config } from './config';
import { makeCreateContext } from './context';
import { makePWARouter } from './pwaRouter';
import { appRouter } from './router';
import { startWorkers } from './startWorkers';

const server = fastify({
  maxParamLength: 5000,
  logger: true,
});

void (async () => {
  const prisma = new PrismaClient();
  const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  try {
    const workers = await startWorkers(prisma, redis);

    const createContext = makeCreateContext(prisma, workers);

    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
      },
    });

    await server.register(makePWARouter(createContext));

    if (config.ENABLE_ADMIN) {
      const serverAdapter = new FastifyAdapter();

      createBullBoard({
        queues: Object.values(workers).map(
          ({ queue }) => new BullMQAdapter(queue),
        ),
        serverAdapter,
      });

      serverAdapter.setBasePath('/admin/queue');
      await server.register(serverAdapter.registerPlugin(), {
        basePath: '/admin/queue',
        prefix: '/admin/queue',
      });
    }

    const address = await server.listen({
      host: config.LISTEN_HOST,
      port: config.PORT,
    });

    process.on('SIGINT', () => {
      console.log(`SIGINT received, shutting web server down`);

      void server
        .close()
        .then(() => {
          process.exit();
        })
        .catch(() => {
          process.exit(1);
        });
    });

    console.log(`Server running at ${address}`);
  } catch (e) {
    server.log.error(e);
    process.exit(1);
  }
})();
