import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";
import { z } from "zod";
import { config } from "@nihalgonsalves/expenses-backend/src/config";
import { getBackendWebApp } from "@nihalgonsalves/expenses-backend/src/web-context";
import { initBackendSentry } from "@nihalgonsalves/expenses-backend/src/sentry";
import {
  THEME_DEFAULT,
  themeColors,
  ZTheme,
} from "@nihalgonsalves/expenses-shared/types/theme";

globalThis.Response = FastResponse;
initBackendSentry();

const handleManifestRequest = async (request: Request) => {
  const backend = await getBackendWebApp();
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

const handleAuthRequest = async (request: Request) => {
  const backend = await getBackendWebApp();
  return backend.auth.handler(request);
};

const handleHealthRequest = async () => {
  try {
    const backend = await getBackendWebApp();
    const result = await backend.runtime.prisma.$queryRaw`SELECT 1 as one`;
    z.array(z.object({ one: z.literal(1) })).parse(result);

    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
};

// oxlint-disable-next-line import/no-default-export
export default createServerEntry({
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/healthz") {
      return handleHealthRequest();
    }

    if (pathname === "/manifest.webmanifest") {
      return handleManifestRequest(request);
    }

    if (pathname.startsWith("/api/auth")) {
      return handleAuthRequest(request);
    }

    return handler.fetch(request);
  },
});
