import type { AppErrorCode } from "@nihalgonsalves/expenses-shared/errors";
import { ZodError } from "zod";

import { IS_PROD } from "../config.ts";

export type AppErrorOptions = {
  message?: string;
  code: AppErrorCode;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor({ message, code, cause }: AppErrorOptions) {
    super(message ?? code, { cause });
    this.name = "AppError";
    this.code = code;
    // Error properties are not consistently serialized by server-function
    // adapters. Make the public discriminator an own enumerable property.
    Object.defineProperty(this, "code", { enumerable: true });
  }
}

export const getErrorMessage = (error: unknown) => {
  if (IS_PROD) {
    return "Internal Server Error";
  }

  return error instanceof Error ? error.message : "Unknown Error";
};

export const getInternalError = (error: unknown): AppErrorOptions => ({
  message: getErrorMessage(error),
  code: "INTERNAL_SERVER_ERROR",
  cause: error,
});

/**
 * Normalize an exception at a server-function boundary. AppErrors are safe to
 * expose; everything else keeps its cause for Sentry but gets a stable public
 * error code and (in production) a non-sensitive message.
 */
export const normalizeAppError = (error: unknown): AppError => {
  // Do not forward `cause` or `stack`: TanStack Start's serializer includes
  // both, and they can expose database errors, query parameters, and source
  // paths. The caller/middleware must capture the original exception first.
  const normalized =
    error instanceof AppError
      ? new AppError({ code: error.code, message: error.message })
      : error instanceof ZodError
        ? new AppError({ code: "BAD_REQUEST", message: "Invalid request" })
        : new AppError({
            code: "INTERNAL_SERVER_ERROR",
            message: getErrorMessage(error),
          });

  Object.defineProperty(normalized, "stack", { value: undefined });
  return normalized;
};
