import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { createAuth } from "@nihalgonsalves/expenses-backend/src/utils/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<ReturnType<typeof createAuth>>()],
});
