import "./init";

import * as Sentry from "@sentry/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import type { AppRouter } from "@nihalgonsalves/expenses-backend/build";

import { getQueryClient, TrpcProvider } from "./api/TrpcProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFoundPage } from "./components/NotFoundPage";
import { config } from "./config";
import { routeTree } from "./routeTree.gen";

const getRouter = () => {
  const url = config.VITE_API_BASE_URL;

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
      }),
    ],
  });

  const queryClient = getQueryClient();

  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });

  const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    defaultPreload: "intent",
    context: {
      trpcClient,
      queryClient,
      trpc,
    },
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
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  return router;
};

const App = () => <RouterProvider router={getRouter()} context={{}} />;

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('div[id="root"] not found');
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
