import { config } from "#/config";
import { createIsomorphicFn, createServerOnlyFn } from "@tanstack/react-start";

export const getBaseApiUrl = createServerOnlyFn(() => {
  if (process.env["NODE_ENV"] !== "production") {
    return "http://localhost:5174/";
  }

  const backendBaseUrl = process.env["API_BASE_URL"];
  if (!backendBaseUrl) {
    throw new Error("API_BASE_URL must be set in server environment");
  }

  return backendBaseUrl;
});

export const getTrpcBaseUrl = createIsomorphicFn()
  .client(() => config.VITE_API_BASE_URL)
  .server(() => new URL("/trpc", getBaseApiUrl()).toString());
