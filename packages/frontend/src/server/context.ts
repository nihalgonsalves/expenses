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

export const getServerContext = async () => {
  const { context, responseHeaders } = await getBackendWebContext(getRequest());
  commitResponseHeaders(responseHeaders);
  return context;
};

export const withServerContext = async <T>(
  handler: (
    context: Awaited<ReturnType<typeof getServerContext>>,
  ) => Promise<T>,
) => {
  const { context, responseHeaders } = await getBackendWebContext(getRequest());

  try {
    return await handler(context);
  } finally {
    commitResponseHeaders(responseHeaders);
  }
};

export const getRequiredServerContext = async () => {
  const context = await getServerContext();

  if (!context.user) {
    throw new AppError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return { ...context, user: context.user };
};

export const withRequiredServerContext = async <T>(
  handler: (
    context: Awaited<ReturnType<typeof getRequiredServerContext>>,
  ) => Promise<T>,
) =>
  withServerContext(async (context) => {
    if (!context.user) {
      throw new AppError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    return handler({ ...context, user: context.user });
  });
