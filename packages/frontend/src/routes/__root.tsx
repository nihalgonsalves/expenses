import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Trace } from "@react-trace/core";
import { CopyToClipboardPlugin } from "@react-trace/plugin-copy-to-clipboard";
import { OpenEditorPlugin } from "@react-trace/plugin-open-editor";
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
    const user = queryClient
      .fetchQuery({ ...trpc.user.me.queryOptions(), staleTime: Infinity })
      .catch(() => null);

    const configResult = queryClient
      .fetchQuery({ ...trpc.config.queryOptions(), staleTime: Infinity })
      .catch(() => null);

    return { user: await user, config: await configResult };
  },
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const context = Route.useRouteContext();

  return (
    <>
      <GlobalHookContainer />
      <MotionConfig reducedMotion="user">
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            passkey
            authClient={authClient}
            {...(context.config?.hasOauth && {
              genericOAuth: { providers: context.config.oauthProviders },
            })}
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
      {context.user != null && <PWAInstall />}
      {import.meta.env.DEV && !config.VITE_INTEGRATION_TEST ? (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <Trace
            // oxlint-disable-next-line typescript/no-unsafe-assignment
            root={import.meta.env["VITE_ROOT"]}
            plugins={[CopyToClipboardPlugin(), OpenEditorPlugin()]}
          />
        </>
      ) : null}
    </>
  );
}
