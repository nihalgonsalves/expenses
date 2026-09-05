import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  emailOTPClient,
} from "better-auth/client/plugins";
import type { createAuth } from "@nihalgonsalves/expenses-backend/src/utils/auth";
import { passkeyClient } from "@better-auth/passkey/client";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<ReturnType<typeof createAuth>>(),
    passkeyClient(),
    apiKeyClient(),
    emailOTPClient(),
  ],
});
