import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
// eslint-disable-next-line import/no-extraneous-dependencies
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { MotionConfig } from "motion/react";

import type { TRPCClient, TRPCOptionsProxy } from "../api/trpc";
import { useOffLineToaster } from "../api/useOffLineToaster";
import { usePrefetchQueries } from "../api/usePrefetchQueries";
import { TooltipRoot } from "../components/TooltipRoot";
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

export type RouterContext = {
  queryClient: QueryClient;
  trpcClient: TRPCClient;
  trpc: TRPCOptionsProxy;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <GlobalHookContainer />
      <MotionConfig reducedMotion="user">
        <Outlet />
      </MotionConfig>
      <TooltipRoot />
      <Toaster />
      {import.meta.env.DEV && !config.VITE_INTEGRATION_TEST ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  ),
});
