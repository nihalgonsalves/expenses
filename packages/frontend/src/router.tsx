import * as Sentry from "@sentry/react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@nihalgonsalves/expenses-backend/build";
import {
  getQueryClient,
  TrpcProvider,
  asyncStoragePersister,
} from "./api/trpc-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { NotFoundPage } from "./components/not-found-page";
import { config } from "./config";
import { routeTree } from "./routeTree.gen";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { persistQueryClientRestore } from "@tanstack/react-query-persist-client";
import { getTrpcBaseUrl } from "./utils/get-api-base-url";

export const getRouter = async () => {
  const getIncomingHeaders = () =>
    createIsomorphicFn()
      .client(() => ({}))
      // 🤷🏽‍♂️ probably tsc/tsgo differences
      // oxlint-disable-next-line typescript/no-unsafe-return
      .server(() => getRequestHeaders());

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        headers: getIncomingHeaders(),
        url: getTrpcBaseUrl(),
      }),
    ],
  });

  const queryClient = getQueryClient();

  const persistClientRestore = createIsomorphicFn().client(async () =>
    persistQueryClientRestore({
      queryClient,
      persister: asyncStoragePersister,
      buster: config.VITE_GIT_COMMIT_SHA,
    }),
  );
  await persistClientRestore();

  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });

  const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    context: { queryClient, trpcClient, trpc },
    scrollRestoration: true,
    defaultPreload: "intent",
    Wrap: ({ children }) => (
      <TrpcProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </TrpcProvider>
    ),
  });

  Sentry.init({
    ...(config.VITE_SENTRY_DSN ? { dsn: config.VITE_SENTRY_DSN } : {}),
    release: config.VITE_GIT_COMMIT_SHA,
    integrations: [
      Sentry.browserProfilingIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ["error", "warn"],
      }),
      Sentry.httpClientIntegration(),
      Sentry.reportingObserverIntegration(),
      // Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  });

  return router;
};
