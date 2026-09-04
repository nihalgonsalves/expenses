import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { closeBackendRuntime, createBackendRuntime } from "./runtime.ts";
import { initBackendSentry } from "./sentry.ts";

initBackendSentry([nodeProfilingIntegration()]);

const runtime = await createBackendRuntime();

const shutdown = async () => {
  console.log(`Shutdown received, shutting workers down`);
  await closeBackendRuntime(runtime);
  await Sentry.close(1000);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

console.log("Worker process started");
