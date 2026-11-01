import {
  captureException,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { isNotFound, isRedirect } from "@tanstack/react-router";
import {
  AppError,
  normalizeAppError,
} from "@nihalgonsalves/expenses-backend/src/utils/errors";

const sentryServerFunctionMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isRedirect(error) || isNotFound(error)) throw error;

    // Expected request/domain errors do not need an event. An internal
    // AppError may still retain the original service failure as its cause.
    if (
      !(error instanceof AppError) ||
      error.code === "INTERNAL_SERVER_ERROR"
    ) {
      const cause = error instanceof AppError ? error.cause : undefined;
      captureException(cause !== undefined ? cause : error, {
        mechanism: {
          type: "auto.middleware.tanstackstart.server_function",
          handled: false,
        },
      });
    }

    throw normalizeAppError(error);
  }
});

// Defining a custom Start instance replaces the framework defaults, so retain
// the built-in CSRF protection explicitly for server-function endpoints.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [sentryGlobalRequestMiddleware, csrfMiddleware],
  functionMiddleware: [sentryServerFunctionMiddleware],
}));
