import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";

import { IS_PROD } from "../config.ts";

export const getErrorMessage = (error: unknown) => {
  if (IS_PROD) {
    return "Internal Server Error";
  }

  return error instanceof Error ? error.message : "Unknown Error";
};

export const getTRPCError = (
  error: unknown,
): {
  message: string;
  code: TRPC_ERROR_CODE_KEY;
  cause: unknown;
} => ({
  message: getErrorMessage(error),
  code: "INTERNAL_SERVER_ERROR",
  cause: error,
});
