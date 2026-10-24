import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@nihalgonsalves/expenses-backend/src/service/user/user-api.server";

import { withApiKey } from "../../server/api-key-auth.server";

export const getV1MeResponse = (
  user: Parameters<typeof getCurrentUser>[0]["user"],
  headers: Headers,
) => Response.json(getCurrentUser({ user }), { headers });

export const getV1Me = withApiKey(({ context, headers }) =>
  getV1MeResponse(context.user, headers),
);

export const Route = createFileRoute("/v1/me")({
  server: {
    handlers: {
      GET: async ({ request }) => getV1Me(request),
    },
  },
});
