import { z } from "zod";

export const LOCALSPACE_NAMESPACE = "expenses";
export const REACT_QUERY_CACHE_LOCALSPACE = "react-query-cache";
export const PREFERENCES_LOCALSPACE = "preferences";

const ZEnv = z.object({
  VITE_API_BASE_URL: z.string().default("/api/trpc"),
  VITE_ENV_NAME: z.string().default("development"),
  VITE_GIT_COMMIT_SHA: z.string().default("unknown"),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_INTEGRATION_TEST: z.coerce.boolean().default(false),
});

export const config = ZEnv.parse(import.meta.env);
