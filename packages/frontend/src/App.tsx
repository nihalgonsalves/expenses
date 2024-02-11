import "temporal-polyfill/global";

import emojiMartData from "@emoji-mart/data";
import * as Sentry from "@sentry/react";
import { init as initEmojiMart } from "emoji-mart";
import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import { TrpcProvider } from "./api/TrpcProvider";
import { useOffLineToaster } from "./api/useOffLineToaster";
import { usePrefetchQueries } from "./api/usePrefetchQueries";
import { config } from "./config";
import { registerSW, useSwUpdateCheck } from "./registerSW";
import { RouterProvider, routes } from "./routes";
import { useThemeSync } from "./state/theme";

Sentry.init({
  ...(config.VITE_SENTRY_DSN ? { dsn: config.VITE_SENTRY_DSN } : {}),
  release: config.VITE_GIT_COMMIT_SHA,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      ),
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const sentryCreateBrowserRouter =
  Sentry.wrapCreateBrowserRouter(createBrowserRouter);

const router = sentryCreateBrowserRouter(routes);

await registerSW();

// TODO: Use a react-query client instead of baked-in data
await initEmojiMart({ data: emojiMartData });

import.meta.hot?.accept(() => {
  void registerSW();
});

const GlobalHookContainer = () => {
  useSwUpdateCheck();
  useOffLineToaster();
  usePrefetchQueries();
  useThemeSync();

  return null;
};

export const App = () => (
  <TrpcProvider>
    <GlobalHookContainer />
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
    <Toaster
      toastOptions={{
        success: {
          iconTheme: {
            primary: "hsl(var(--primary))",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(var(--destructive))",
            secondary: "#ffffff",
          },
        },
      }}
    />
  </TrpcProvider>
);
