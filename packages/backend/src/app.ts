import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { PrismaClient } from '@prisma/client';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { Queue } from 'bullmq';
import fastify from 'fastify';
import IORedis from 'ioredis';

import { NOTIFICATION_BULLMQ_QUEUE, config } from './config';
import { makeCreateContext } from './context';
import { appRouter } from './router';

const server = fastify({
  maxParamLength: 5000,
  logger: true,
});

void (async () => {
  const prisma = new PrismaClient();
  const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  try {
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext: makeCreateContext(prisma, redis),
      },
    });

    if (config.ENABLE_ADMIN) {
      const serverAdapter = new FastifyAdapter();

      createBullBoard({
        queues: [
          new BullMQAdapter(
            new Queue(NOTIFICATION_BULLMQ_QUEUE, {
              connection: redis,
            }),
          ),
        ],
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

    console.log(`Server running at ${address}`);
  } catch (e) {
    server.log.error(e);
    process.exit(1);
  }
})();
