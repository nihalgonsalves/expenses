import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
  ClientOnly,
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { MotionConfig } from "motion/react";

import {
  THEME_DEFAULT,
  ZTheme,
} from "@nihalgonsalves/expenses-shared/types/theme";

import type { TRPCClient, TRPCOptionsProxy } from "../api/trpc";
import { useOffLineToaster } from "../api/use-off-line-toaster";
import { usePrefetchQueries } from "../api/use-prefetch-queries";
import { TooltipRoot } from "../components/tooltip-root";
import { Toaster } from "../components/ui/toaster";
import { config } from "../config";
import mainCss from "../main.css?url";
import { useSwUpdateCheck } from "../register-sw";
import { getThemeDataAttribute, useThemeSync } from "../state/theme";
import { PWAInstall } from "#/components/pwa-install";
import { ReactTrace } from "#/components/react-trace";

const GlobalHookContainer = () => {
  useSwUpdateCheck();
  useOffLineToaster();
  usePrefetchQueries();
  useThemeSync();

  useEffect(() => {
    document.body.dataset["hydrated"] = "true";
  }, []);

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
  head: () => ({
    title: "Expenses",
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content:
          "width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover",
      },
      { name: "color-scheme", content: "normal" },
      { name: "theme-color", content: "hsl(201, 100%, 46%)" },
    ],
    links: [
      {
        rel: "manifest",
        href: "/api/manifest.webmanifest",
        crossOrigin: "use-credentials",
      },
      { rel: "stylesheet", href: mainCss },
      { rel: "icon", href: "/assets/icon-monochrome.svg", sizes: "any" },
    ],
  }),
  component: () => (
    <>
      <GlobalHookContainer />
      <MotionConfig reducedMotion="user">
        <Outlet />
      </MotionConfig>
      <TooltipRoot />
      <Toaster />
      <ConditionalPWAInstall />
    </>
  ),
  shellComponent: RootDocument,
});

const ConditionalPWAInstall = () => {
  const { user } = Route.useRouteContext();

  if (!user) return null;

  return (
    <ClientOnly>
      <PWAInstall />
    </ClientOnly>
  );
};

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext();
  const parsedTheme = ZTheme.catch(THEME_DEFAULT).parse(user?.theme);

  return (
    <html lang="en" data-theme={getThemeDataAttribute("system", parsedTheme)}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.DEV && !config.VITE_INTEGRATION_TEST ? (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactTrace />
          </>
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
