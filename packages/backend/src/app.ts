import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { trpcServer } from "@hono/trpc-server";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import IORedis from "ioredis";

import { config } from "./config";
import { makeCreateContext } from "./context";
import { makePWARouter } from "./pwaRouter";
import { appRouter } from "./router";
import { startWorkers } from "./startWorkers";

export const createApp = async (prisma: PrismaClient, redis: IORedis) => {
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
  const prisma = new PrismaClient();
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

      server.close();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
