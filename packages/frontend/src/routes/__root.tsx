import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
// eslint-disable-next-line import/no-extraneous-dependencies
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { MotionConfig } from "motion/react";

import { useOffLineToaster } from "../api/useOffLineToaster";
import { usePrefetchQueries } from "../api/usePrefetchQueries";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toaster } from "../components/ui/toaster";
import { config } from "../config";
import { useSwUpdateCheck } from "../registerSW";
import { useThemeSync } from "../state/theme";

const GlobalHookContainer = () => {
  useSwUpdateCheck();
  useOffLineToaster();
  usePrefetchQueries();
  useThemeSync();

  return null;
};

export type RouterContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <GlobalHookContainer />
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </MotionConfig>
      <Toaster />
      {import.meta.env.DEV && !config.VITE_INTEGRATION_TEST ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  ),
});
