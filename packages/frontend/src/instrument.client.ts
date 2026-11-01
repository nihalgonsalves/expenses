import * as Sentry from "@sentry/tanstackstart-react";
import { config } from "./config";

Sentry.init({
  ...(config.VITE_SENTRY_DSN ? { dsn: config.VITE_SENTRY_DSN } : {}),
  release: config.VITE_GIT_COMMIT_SHA,
  integrations: [
    Sentry.browserProfilingIntegration(),
    Sentry.captureConsoleIntegration({
      levels: ["error", "warn"],
    }),
    Sentry.httpClientIntegration(),
    Sentry.reportingObserverIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Keep in sync with instrument.server.mjs
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
