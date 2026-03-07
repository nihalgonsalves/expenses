import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { RESET_PASSWORD_ROUTE } from "@nihalgonsalves/expenses-shared/routes";

import { Alert, AlertTitle } from "../../components/ui/alert";
import { Root } from "../../pages/Root";
import { AuthView } from "@daveyplate/better-auth-ui";

export const Route = createFileRoute(RESET_PASSWORD_ROUTE)({
  component: RouteComponent,
  validateSearch: z.object({
    token: z.string().min(1).optional().catch(undefined),
  }),
});

function RouteComponent() {
  const { token } = Route.useSearch();

  return (
    <Root title="Reset Password" className="p-0 sm:p-5">
      {token ? (
        <AuthView className="" pathname="/reset-password" />
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Token not found</AlertTitle>
        </Alert>
      )}
    </Root>
  );
}
