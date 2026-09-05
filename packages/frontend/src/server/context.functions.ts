import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getBackendWebContext } from "@nihalgonsalves/expenses-backend/src/web-context";
import { AppError } from "@nihalgonsalves/expenses-backend/src/utils/errors";

const commitResponseHeaders = (headers: Headers) => {
  for (const [name, value] of headers.entries()) {
    if (name !== "set-cookie") {
      setResponseHeader(name, value);
    }
  }

  const setCookies = headers.getSetCookie();
  if (setCookies.length > 0) {
    setResponseHeader("set-cookie", setCookies);
  }
};

export const serverContextMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const { context: serverContext, responseHeaders } =
    await getBackendWebContext(getRequest());

  setResponseHeader("Cache-Control", "private, no-store");

  try {
    return await next({ context: serverContext });
  } finally {
    commitResponseHeaders(responseHeaders);
  }
});

export const requiredServerContextMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const { context: serverContext, responseHeaders } =
    await getBackendWebContext(getRequest());

  setResponseHeader("Cache-Control", "private, no-store");

  try {
    if (!serverContext.user) {
      throw new AppError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    return await next({
      context: {
        ...serverContext,
        user: serverContext.user,
      },
    });
  } finally {
    commitResponseHeaders(responseHeaders);
  }
});
