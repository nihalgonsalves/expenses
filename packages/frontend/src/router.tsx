import * as Sentry from "@sentry/react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import {
  getQueryClient,
  asyncStoragePersister,
  QueryProvider,
} from "./api/query-client-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { NotFoundPage } from "./components/not-found-page";
import { config } from "./config";
import { routeTree } from "./routeTree.gen";

import { persistQueryClientRestore } from "@tanstack/react-query-persist-client";

export const getRouter = async () => {
  const queryClient = getQueryClient();

  const persistClientRestore = createIsomorphicFn().client(async () =>
    persistQueryClientRestore({
      queryClient,
      persister: asyncStoragePersister,
      buster: config.VITE_GIT_COMMIT_SHA,
    }),
  );
  await persistClientRestore();

  const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    Wrap: ({ children }) => (
      <QueryProvider queryClient={queryClient}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </QueryProvider>
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
