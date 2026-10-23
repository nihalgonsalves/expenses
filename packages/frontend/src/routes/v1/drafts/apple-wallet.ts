import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { createAppleWalletDraft } from "@nihalgonsalves/expenses-backend/src/service/transaction-draft/transaction-draft-api.server";
import { ZCreateAppleWalletDraftInput } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { getApiKeyContext } from "../../../server/api-key-auth.server";

export const postV1AppleWalletDraft = async (request: Request) => {
  const apiKeyContext = await getApiKeyContext(request);
  if (apiKeyContext === null) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const headers = new Headers(apiKeyContext.responseHeaders);
  headers.set("Cache-Control", "private, no-store");

  try {
    const input = ZCreateAppleWalletDraftInput.parse(await request.json());
    const draft = await createAppleWalletDraft(apiKeyContext.context, input);

    return Response.json(draft, { status: 201, headers });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json(
        { code: "BAD_REQUEST", message: "Invalid request" },
        { status: 400, headers },
      );
    }
    throw error;
  }
};

export const Route = createFileRoute("/v1/drafts/apple-wallet")({
  server: {
    handlers: {
      POST: async ({ request }) => postV1AppleWalletDraft(request),
    },
  },
});
