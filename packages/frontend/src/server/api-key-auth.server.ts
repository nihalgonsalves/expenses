import type { ContextObj } from "@nihalgonsalves/expenses-backend/src/context";
import { getBearerApiKey } from "@nihalgonsalves/expenses-backend/src/utils/auth";
import { getBackendWebContext } from "@nihalgonsalves/expenses-backend/src/web-context";

type ApiKeyContext = Omit<ContextObj, "user"> & {
  user: NonNullable<ContextObj["user"]>;
};

export const getApiKeyContext = async (request: Request) => {
  const apiKey = getBearerApiKey(request.headers);
  if (apiKey === null) return null;

  const { context, responseHeaders } = await getBackendWebContext(request);
  const result = await context.betterAuth.api.verifyApiKey({
    body: { key: apiKey },
  });
  if (!result.valid || result.key === null) return null;

  const user = await context.prisma.user.findUnique({
    where: { id: result.key.referenceId },
  });
  if (user === null) return null;

  return {
    context: { ...context, user } satisfies ApiKeyContext,
    responseHeaders,
  };
};
