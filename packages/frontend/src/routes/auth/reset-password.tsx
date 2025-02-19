import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { RESET_PASSWORD_ROUTE } from "@nihalgonsalves/expenses-shared/routes";

import { ResetPasswordForm } from "../../components/ResetPasswordForm";
import { Alert, AlertTitle } from "../../components/ui/alert";
import { Root } from "../../pages/Root";

const ResetPasswordPage = () => {
  const { token } = Route.useSearch();

  return (
    <Root
      title="Reset Password"
      className="m-auto p-0 sm:grid sm:max-w-xl sm:place-items-center sm:p-5"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert $variant="destructive">
          <AlertTitle>Token not found</AlertTitle>
        </Alert>
      )}
    </Root>
  );
};

export const Route = createFileRoute(RESET_PASSWORD_ROUTE)({
  component: ResetPasswordPage,
  validateSearch: z.object({
    token: z.string().min(1).optional().catch(undefined),
  }),
});
