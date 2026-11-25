import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";
import { z } from "zod";
import { config } from "@nihalgonsalves/expenses-backend/src/config";
import { config as frontendConfig } from "./config";
import { createSecurityHeaders, generateNonce } from "./csp";
import { getBackendWebApp } from "@nihalgonsalves/expenses-backend/src/web-context";
import {
  THEME_DEFAULT,
  themeColors,
  ZTheme,
} from "@nihalgonsalves/expenses-shared/types/theme";

globalThis.Response = FastResponse;

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

const securityHeaders = createSecurityHeaders({
  dev: import.meta.env.DEV,
  sentryDsn: frontendConfig.VITE_SENTRY_DSN,
  reportOnly: process.env["CSP_REPORT_ONLY"] === "true",
});

const withHeaders = (response: Response, headers: Record<string, string>) => {
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
};

const handleNonDocumentRequest = async (
  request: Request,
): Promise<Response | undefined> => {
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

  return undefined;
};

// oxlint-disable-next-line import/no-default-export
export default createServerEntry(
  wrapFetchWithSentry({
    async fetch(request: Request) {
      const response = await handleNonDocumentRequest(request);
      if (response) {
        return withHeaders(response, securityHeaders());
      }

      // `getRouter` reads the nonce from the Start context
      const nonce = generateNonce();
      return withHeaders(
        await handler.fetch(request, { context: { nonce } }),
        securityHeaders(nonce),
      );
    },
  }),
);
