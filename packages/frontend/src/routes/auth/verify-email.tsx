import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { VerifyEmailForm } from "../../components/VerifyEmailForm";
import { Alert, AlertTitle } from "../../components/ui/alert";
import { Root } from "../../pages/Root";

const VerifyEmailPage = () => {
  const { token } = Route.useSearch();

  return (
    <Root
      title="Verify Email"
      className="m-auto p-0 sm:grid sm:max-w-xl sm:place-items-center sm:p-5"
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Token not found</AlertTitle>
        </Alert>
      )}
    </Root>
  );
};

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailPage,
  validateSearch: z.object({
    token: z.string().min(1).optional().catch(undefined),
  }),
});
