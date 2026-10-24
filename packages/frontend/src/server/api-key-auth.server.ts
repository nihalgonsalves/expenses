import { z } from "zod";
import type { ContextObj } from "@nihalgonsalves/expenses-backend/src/context";
import { getBearerApiKey } from "@nihalgonsalves/expenses-backend/src/utils/auth";
import { getBackendWebContext } from "@nihalgonsalves/expenses-backend/src/web-context";

import { problemResponse } from "./problem-details";

type ApiKeyContext = Omit<ContextObj, "user"> & {
  user: NonNullable<ContextObj["user"]>;
};

type ApiKeyContextResult =
  | { type: "authenticated"; context: ApiKeyContext; responseHeaders: Headers }
  | { type: "unauthorized" }
  | { type: "rate-limited"; tryAgainInMs: number | undefined };

const ZRateLimitedError = z.object({
  code: z.literal("RATE_LIMITED"),
  details: z.object({ tryAgainIn: z.number() }).optional(),
});

const getApiKeyContext = async (
  request: Request,
): Promise<ApiKeyContextResult> => {
  const apiKey = getBearerApiKey(request.headers);
  if (apiKey === null) return { type: "unauthorized" };

  const { context, responseHeaders } = await getBackendWebContext(request);
  const result = await context.betterAuth.api.verifyApiKey({
    body: { key: apiKey },
  });

  if (!result.valid || result.key === null) {
    const rateLimited = ZRateLimitedError.safeParse(result.error);
    return rateLimited.success
      ? {
          type: "rate-limited",
          tryAgainInMs: rateLimited.data.details?.tryAgainIn,
        }
      : { type: "unauthorized" };
  }

  const user = await context.prisma.user.findUnique({
    where: { id: result.key.referenceId },
  });
  if (user === null) return { type: "unauthorized" };

  return {
    type: "authenticated",
    context: { ...context, user },
    responseHeaders,
  };
};

const noStoreHeaders = (init?: Headers) => {
  const headers = new Headers(init);
  headers.set("Cache-Control", "private, no-store");
  return headers;
};

/**
 * Wraps a `/v1` route handler with API key authentication. `headers` must be
 * passed to the returned response.
 */
export const withApiKey =
  (
    handler: (args: {
      request: Request;
      context: ApiKeyContext;
      headers: Headers;
    }) => Promise<Response> | Response,
  ) =>
  async (request: Request): Promise<Response> => {
    const result = await getApiKeyContext(request);

    if (result.type === "unauthorized") {
      const headers = noStoreHeaders();
      // required on a 401 by RFC 9110
      headers.set("WWW-Authenticate", "Bearer");
      return problemResponse({
        status: 401,
        detail: "A valid API key is required",
        headers,
      });
    }

    if (result.type === "rate-limited") {
      const headers = noStoreHeaders();
      if (result.tryAgainInMs !== undefined) {
        headers.set("Retry-After", `${Math.ceil(result.tryAgainInMs / 1000)}`);
      }
      return problemResponse({
        status: 429,
        detail: "API key rate limit exceeded",
        headers,
      });
    }

    return handler({
      request,
      context: result.context,
      headers: noStoreHeaders(result.responseHeaders),
    });
  };
