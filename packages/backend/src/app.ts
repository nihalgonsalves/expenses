import "temporal-polyfill/global";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { trpcServer } from "@hono/trpc-server";
import { PrismaClient } from "@prisma/client";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import IORedis from "ioredis";

import { appRouter } from "./appRouter";
import { config } from "./config";
import { makeCreateContext } from "./context";
import { makePWARouter } from "./pwaRouter";
import { startWorkers } from "./startWorkers";

export const createPrisma = () =>
  new PrismaClient({
    omit: {
      user: { passwordHash: true, passwordResetToken: true },
    },
  });

export type PrismaClientType = ReturnType<typeof createPrisma>;

export const createApp = async (prisma: PrismaClientType, redis: IORedis) => {
  const app = new Hono();
  const workers = await startWorkers(prisma, redis);

  const createContext = makeCreateContext(prisma, workers);

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext,
    }),
  );

  app.route("/", makePWARouter(createContext));

  if (config.ENABLE_ADMIN) {
    const serverAdapter = new HonoAdapter(serveStatic);

    createBullBoard({
      queues: Object.values(workers).map(
        ({ queue }) => new BullMQAdapter(queue),
      ),
      serverAdapter,
    });

    serverAdapter.setBasePath("/admin/queue");
    app.route("/admin/queue", serverAdapter.registerPlugin());
  }

  return app;
};

const getAddress = (address: string) => {
  if (address === "0.0.0.0" || address === "::1" || address == "::") {
    return "localhost";
  }

  return address;
};

void (async () => {
  Sentry.init({
    ...(config.SENTRY_DSN ? { dsn: config.SENTRY_DSN } : {}),
    release: config.GIT_COMMIT_SHA,
    integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  const prisma = new PrismaClient({
    omit: {
      user: { passwordHash: true, passwordResetToken: true },
    },
  });

  const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  try {
    const app = await createApp(prisma, redis);

    if (!IS_PROD) {
      showRoutes(app);
    }

    const server = serve(
      {
        fetch: app.fetch,
        hostname: config.LISTEN_HOST,
        port: config.PORT,
      },
      ({ address, port }) => {
        console.log(
          `Server listening at http://${getAddress(address)}:${port}`,
        );
      },
    );

    process.on("SIGINT", () => {
      console.log(`SIGINT received, shutting web server down`);
      void Sentry.close(1000);
      server.close();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
