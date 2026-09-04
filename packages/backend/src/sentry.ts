import * as Sentry from "@sentry/node";
import { config } from "./config.ts";

type BackendIntegration = Extract<
  NonNullable<Parameters<typeof Sentry.init>[0]>["integrations"],
  unknown[]
>[number];

export const initBackendSentry = (integrations: BackendIntegration[] = []) => {
  Sentry.init({
    ...(config.SENTRY_DSN ? { dsn: config.SENTRY_DSN } : {}),
    ignoreErrors: [/UNAUTHORIZED/],
    release: config.GIT_COMMIT_SHA,
    integrations: [Sentry.prismaIntegration(), ...integrations],
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
  });
};
