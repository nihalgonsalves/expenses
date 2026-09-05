import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requiredServerContextMiddleware } from "../server/context.functions";

const authenticatedMiddleware = [requiredServerContextMiddleware] as const;
const ZApiKeyName = z.string().trim().min(1).max(32);

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .handler(async ({ context }) =>
    context.betterAuth.api.listApiKeys({ headers: context.headers }),
  );

export const createApiKey = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZApiKeyName)
  .handler(async ({ context, data: name }) =>
    context.betterAuth.api.createApiKey({
      body: { name },
      headers: context.headers,
    }),
  );

export const deleteApiKey = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data: keyId }) =>
    context.betterAuth.api.deleteApiKey({
      body: { keyId },
      headers: context.headers,
    }),
  );
