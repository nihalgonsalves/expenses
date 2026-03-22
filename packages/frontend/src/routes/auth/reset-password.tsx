import { z } from "zod";

import { RESET_PASSWORD_ROUTE } from "@nihalgonsalves/expenses-shared/routes";

import { Alert, AlertTitle } from "../../components/ui/alert";
import { Root } from "../../pages/root";
import { AuthView } from "@daveyplate/better-auth-ui";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";

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
      <div className="grid place-items-center p-4">
        {token ? (
          <ClientOnly>
            <AuthView className="" pathname="/reset-password" />
          </ClientOnly>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Token not found</AlertTitle>
          </Alert>
        )}
      </div>
    </Root>
  );
}
