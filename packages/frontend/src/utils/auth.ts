import { createAuthClient } from "better-auth/react";
import {
  genericOAuthClient,
  inferAdditionalFields,
  emailOTPClient,
} from "better-auth/client/plugins";
import type { createAuth } from "@nihalgonsalves/expenses-backend/src/utils/auth";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<ReturnType<typeof createAuth>>(),
    passkeyClient(),
    emailOTPClient(),
    genericOAuthClient(),
  ],
});
