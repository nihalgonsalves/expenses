import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@nihalgonsalves/expenses-backend/src/service/user/user-api.server";

import { getApiKeyContext } from "../../server/api-key-auth.server";

export const getV1MeResponse = (
  user: Parameters<typeof getCurrentUser>[0]["user"],
  responseHeaders: Headers,
) => {
  const headers = new Headers(responseHeaders);
  headers.set("Cache-Control", "private, no-store");

  return Response.json(getCurrentUser({ user }), { headers });
};

export const getV1Me = async (request: Request) => {
  const apiKeyContext = await getApiKeyContext(request);
  if (apiKeyContext === null) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "Unauthorized" },
      { status: 401 },
    );
  }

  return getV1MeResponse(
    apiKeyContext.context.user,
    apiKeyContext.responseHeaders,
  );
};

export const Route = createFileRoute("/v1/me")({
  server: {
    handlers: {
      GET: async ({ request }) => getV1Me(request),
    },
  },
});
