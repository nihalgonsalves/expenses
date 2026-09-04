export const APP_ERROR_CODES = [
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "TOO_MANY_REQUESTS",
  "INTERNAL_SERVER_ERROR",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export const isAppErrorCode = (value: unknown): value is AppErrorCode =>
  typeof value === "string" &&
  (APP_ERROR_CODES as readonly string[]).includes(value);
