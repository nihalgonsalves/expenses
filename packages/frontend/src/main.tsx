import "./init";

import * as Sentry from "@sentry/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { TrpcProvider } from "./api/TrpcProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFoundPage } from "./components/NotFoundPage";
import { TooltipRoot } from "./components/TooltipRoot";
import { config } from "./config";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  context: {},
});

const App = () => (
  <TrpcProvider>
    <ErrorBoundary>
      <RouterProvider router={router} context={{}} />
      <TooltipRoot />
    </ErrorBoundary>
  </TrpcProvider>
);

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}

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
