import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { config } from "@nihalgonsalves/expenses-backend/src/config";

const ZAppConfig = z.object({
  name: z.string(),
  hasOauth: z.boolean(),
  oauthProviders: z.array(z.object({ provider: z.string(), name: z.string() })),
});

/**
 * Public build/runtime configuration used by the root layout. It has no
 * request-specific data, so do not initialize the database, queues, or auth
 */
export const getAppConfig = createServerFn({ method: "GET" }).handler(() =>
  ZAppConfig.parse({
    name: config.APP_NAME,
    hasOauth: config.OAUTH_PROVIDER_CONFIG.length > 0,
    oauthProviders: config.OAUTH_PROVIDER_CONFIG.map((provider) => ({
      provider: provider.providerId,
      name: provider.name,
    })),
  }),
);

export const appConfigQueryOptions = () =>
  queryOptions({
    queryKey: ["app-config"] as const,
    queryFn: async () => getAppConfig(),
    staleTime: Infinity,
  });
