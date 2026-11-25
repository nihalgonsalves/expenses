// NOTE: Not processed by Vite, copied as-is
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  ...(process.env["VITE_SENTRY_DSN"]
    ? { dsn: process.env["VITE_SENTRY_DSN"] }
    : {}),
  release: process.env["VITE_GIT_COMMIT_SHA"],
  // Same default as VITE_ENV_NAME in src/config.ts
  environment: process.env["VITE_ENV_NAME"] ?? "development",
  ignoreErrors: [/UNAUTHORIZED/],
  integrations: [Sentry.prismaIntegration()],
  tracesSampleRate: 1.0,
  // Keep in sync with src/instrument.client.ts
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: {
        allow: ["user-agent", "content-type", "accept", "content-length"],
      },
      response: false,
    },
    httpBodies: [],
    urlQueryParams: { deny: ["token", "code", "state", "callbackURL"] },
    queues: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
