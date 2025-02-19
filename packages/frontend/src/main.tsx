import "./init";

import * as Sentry from "@sentry/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useMemo } from "react";
import ReactDOM from "react-dom/client";

import { TrpcProvider } from "./api/TrpcProvider";
import { useCurrentUser } from "./api/useCurrentUser";
import { NotFoundPage } from "./components/NotFoundPage";
import { config } from "./config";
import { routeTree } from "./routeTree.gen";
import type { RouterContext } from "./routes/__root";

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  context: {
    auth: {
      user: undefined,
      errorCode: undefined,
    },
  },
});

const InnerApp = () => {
  const currentUser = useCurrentUser();

  const contextValue: RouterContext = useMemo(
    () => ({
      auth: {
        user: currentUser.data,
        errorCode: currentUser.error?.data?.httpStatus,
      },
    }),
    [currentUser.data, currentUser.error],
  );

  return <RouterProvider router={router} context={contextValue} />;
};

const App = () => (
  <TrpcProvider>
    <InnerApp />
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
