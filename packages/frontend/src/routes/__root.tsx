import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
// eslint-disable-next-line import/no-extraneous-dependencies
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { MotionConfig } from "motion/react";
import { Toaster } from "react-hot-toast";

import { useOffLineToaster } from "../api/useOffLineToaster";
import { usePrefetchQueries } from "../api/usePrefetchQueries";
import { ErrorBoundary } from "../components/ErrorBoundary";
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
      <Toaster
        toastOptions={{
          success: {
            iconTheme: {
              primary: "var(--primary)",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--destructive)",
              secondary: "#ffffff",
            },
          },
        }}
      />
      {import.meta.env.DEV ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  ),
});
