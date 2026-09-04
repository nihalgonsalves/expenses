import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { FastResponse } from "srvx";
import { appRouter } from "@nihalgonsalves/expenses-backend/src/app-router";
import { makeCreateContext } from "@nihalgonsalves/expenses-backend/src/context";
import { config } from "@nihalgonsalves/expenses-backend/src/config";
import { createAuth } from "@nihalgonsalves/expenses-backend/src/utils/auth";
import { createBackendWebRuntime } from "@nihalgonsalves/expenses-backend/src/runtime";
import { initBackendSentry } from "@nihalgonsalves/expenses-backend/src/sentry";
import {
  THEME_DEFAULT,
  themeColors,
  ZTheme,
} from "@nihalgonsalves/expenses-shared/types/theme";

globalThis.Response = FastResponse;
initBackendSentry();

const backendApp = (async () => {
  console.log("Starting backend runtime…");
  const runtime = await createBackendWebRuntime();
  const createContext = makeCreateContext(runtime.prisma, runtime.services);
  const auth = createAuth(runtime.prisma, runtime.services.emailWorker);
  console.log("Backend runtime started");
  return { auth, createContext };
})();

const handleBackendRequest = async (request: Request) => {
  const backend = await backendApp;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/auth")) {
    return backend.auth.handler(request);
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async ({ req, resHeaders }) =>
      backend.createContext({ req, resHeaders }),
  });
};

const handleManifestRequest = async (request: Request) => {
  const backend = await backendApp;
  const responseHeaders = new Headers();
  const context = await backend.createContext({
    req: request,
    resHeaders: responseHeaders,
  });
  const theme = ZTheme.catch(THEME_DEFAULT).parse(context.user?.theme);

  return new Response(
    JSON.stringify({
      id: "/",
      name: config.APP_NAME,
      short_name: config.APP_NAME,
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      lang: "en",
      scope: "/",
      description: "Expenses App",
      theme_color: themeColors[theme].primary,
      icons: [
        {
          src: `/assets/icon-normal-${theme}.svg`,
          type: "image/svg+xml",
          sizes: "any",
          purpose: "any",
        },
        {
          src: `/assets/icon-maskable-${theme}.svg`,
          type: "image/svg+xml",
          sizes: "any",
          purpose: "maskable",
        },
        {
          src: "/assets/icon-monochrome.svg",
          type: "image/svg+xml",
          sizes: "16x16",
          purpose: "monochrome",
        },
      ],
    }),
    {
      status: 200,
      headers: {
        ...Object.fromEntries(responseHeaders),
        "content-type": "application/manifest+json",
      },
    },
  );
};

// oxlint-disable-next-line import/no-default-export
export default createServerEntry({
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (
      pathname === "/manifest.webmanifest" ||
      pathname.startsWith("/api/trpc") ||
      pathname.startsWith("/api/auth")
    ) {
      if (pathname === "/manifest.webmanifest") {
        return handleManifestRequest(request);
      }
      return handleBackendRequest(request);
    }

    return handler.fetch(request);
  },
});
