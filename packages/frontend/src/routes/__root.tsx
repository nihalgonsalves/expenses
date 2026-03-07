import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { MotionConfig } from "motion/react";
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";

import type { TRPCClient, TRPCOptionsProxy } from "../api/trpc";
import { useOffLineToaster } from "../api/useOffLineToaster";
import { usePrefetchQueries } from "../api/usePrefetchQueries";
import { TooltipRoot } from "../components/TooltipRoot";
import { Toaster } from "../components/ui/toaster";
import { config } from "../config";
import { useSwUpdateCheck } from "../registerSW";
import { useThemeSync } from "../state/theme";
import { PWAInstall } from "#/components/PWAInstall";
import { authClient } from "#/utils/auth";

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
  beforeLoad: async ({ context: { queryClient, trpc } }) => {
    const user = await queryClient
      .fetchQuery({ ...trpc.user.me.queryOptions(), staleTime: Infinity })
      .catch(() => null);

    return { user };
  },
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const { user } = Route.useRouteContext();

  return (
    <>
      <GlobalHookContainer />
      <MotionConfig reducedMotion="user">
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            passkey
            authClient={authClient}
            navigate={async (href) => router.navigate({ href })}
            replace={async (href) => router.navigate({ href, replace: true })}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
          >
            <Outlet />
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </MotionConfig>
      <TooltipRoot />
      <Toaster />
      {user != null && <PWAInstall />}
      {import.meta.env.DEV && !config.VITE_INTEGRATION_TEST ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  );
}
