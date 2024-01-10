import { z } from "zod";

export const REACT_QUERY_CACHE_DEXIE_TABLE = "react-query-cache";
export const PREFERENCES_DEXIE_TABLE = "preferences";

const ZEnv = z.object({
  VITE_API_BASE_URL: z.string().default("/api/trpc"),
  VITE_ENV_NAME: z.string().default("development"),
  VITE_GIT_COMMIT_SHA: z.string().default("unknown"),
});

export const config = ZEnv.parse(import.meta.env);
