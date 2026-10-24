import { createFileRoute } from "@tanstack/react-router";
import { z, ZodError } from "zod";
import { createAppleWalletDraft } from "@nihalgonsalves/expenses-backend/src/service/transaction-draft/transaction-draft-api.server";
import { ZCreateAppleWalletDraftInput } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { withApiKey } from "../../../server/api-key-auth.server";
import { problemResponse } from "../../../server/problem-details";

export const postV1AppleWalletDraft = withApiKey(
  async ({ request, context, headers }) => {
    try {
      const input = ZCreateAppleWalletDraftInput.parse(await request.json());
      const draft = await createAppleWalletDraft(context, input);

      return Response.json(draft, { status: 201, headers });
    } catch (error) {
      // detailed messages, since the only way to debug a Shortcut is to show
      // the response
      if (error instanceof ZodError) {
        return problemResponse({
          status: 400,
          detail: z.prettifyError(error),
          headers,
        });
      }
      if (error instanceof SyntaxError) {
        return problemResponse({
          status: 400,
          detail: "Invalid JSON body",
          headers,
        });
      }
      throw error;
    }
  },
);

export const Route = createFileRoute("/v1/drafts/apple-wallet")({
  server: {
    handlers: {
      POST: async ({ request }) => postV1AppleWalletDraft(request),
    },
  },
});
