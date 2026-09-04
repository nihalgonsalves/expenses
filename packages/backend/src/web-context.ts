import { makeCreateContext } from "./context.ts";
import { closeBackendRuntime, createBackendWebRuntime } from "./runtime.ts";
import { createAuth } from "./utils/auth.ts";

// The inferred type of '...' cannot be named without a
// reference to '...' from
// '../../../backend/node_modules/@simplewebauthn/server/script'. This is likely
// not portable. A type annotation is necessary.
export type * from "@simplewebauthn/server";

export const backendWebApp = await (async () => {
  const runtime = await createBackendWebRuntime();
  const createContext = makeCreateContext(runtime.prisma, runtime.services);
  const auth = createAuth(runtime.prisma, runtime.services.emailWorker);

  let isDisposed = false;

  return {
    runtime,
    createContext,
    auth,
    [Symbol.asyncDispose]: async () => {
      if (isDisposed) return;
      isDisposed = true;
      await closeBackendRuntime(runtime);
    },
  };
})();

export const getBackendWebApp = async () => backendWebApp;

export const getBackendWebContext = async (
  request: Request,
  responseHeaders = new Headers(),
) => {
  const app = await getBackendWebApp();
  const context = await app.createContext({
    req: request,
    resHeaders: responseHeaders,
  });

  return { context, responseHeaders };
};
