import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import {
  createIsomorphicFn,
  getGlobalStartContext,
} from "@tanstack/react-start";
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

  // Server: set by the server entry. Client: read from TanStack's csp-nonce meta
  const nonce = getGlobalStartContext()?.nonce;

  const router = createRouter({
    routeTree,
    ...(nonce ? { ssr: { nonce } } : {}),
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

  if (!router.isServer) {
    Sentry.addIntegration(
      Sentry.tanstackRouterBrowserTracingIntegration(router),
    );
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  });

  return router;
};
