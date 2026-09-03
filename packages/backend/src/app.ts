import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { trpcServer } from "@hono/trpc-server";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Hono, type Context } from "hono";
import { showRoutes } from "hono/dev";
import type { Pool } from "pg";

import { appRouter } from "./app-router.ts";
import { config, IS_PROD } from "./config.ts";
import { makeCreateContext, type ContextObj } from "./context.ts";
import { type PrismaClientType, createPrisma } from "./create-prisma.ts";
import { createBullMQPool, migrateBullMQ } from "./postgres.ts";
import { makePWARouter } from "./pwa-router.ts";
import { startWorkers } from "./start-workers.ts";

export type HonoVariables = { context: ContextObj };

export const createApp = async (prisma: PrismaClientType, pool: Pool) => {
  const app = new Hono<{ Variables: HonoVariables }>();
  const workers = await startWorkers(prisma, pool);

  const createContext = makeCreateContext(prisma, workers);

  app.use("*", async (c, next) => {
    const context = await createContext({
      req: c.req.raw,
      resHeaders: c.res.headers,
    });

    c.set("context", context);
    return next();
  });

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_, c: Context<{ Variables: HonoVariables }>) =>
        c.get("context"),
    }),
  );

  app.route("/", makePWARouter());

  app.on(["POST", "GET"], "/auth/*", async (c) => {
    const url = new URL(c.req.url);
    url.pathname = `/api${url.pathname}`;

    return c.get("context").betterAuth.handler(
      new Request(url, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.raw.body,
      }),
    );
  });

  if (config.ENABLE_ADMIN) {
    const serverAdapter = new HonoAdapter(serveStatic);

    createBullBoard({
      queues: Object.values(workers).map(
        ({ queue }) =>
          // @ts-expect-error mismatch Redis/Postgres backend
          new BullMQAdapter(queue),
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
    ignoreErrors: [/UNAUTHORIZED/],
    release: config.GIT_COMMIT_SHA,
    integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
  });

  const prisma = createPrisma();

  const bullMQPool = createBullMQPool(config.DATABASE_URL);

  try {
    await migrateBullMQ(bullMQPool);
    const app = await createApp(prisma, bullMQPool);

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
      void bullMQPool.end();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
