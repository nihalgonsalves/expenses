import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";

import { useCurrentUser } from "../../api/useCurrentUser";
import { SignInForm } from "../../components/SignInForm";
import { Root } from "../../pages/Root";

const AuthenticationPage = () => {
  const currentUser = useCurrentUser();
  const { redirect } = Route.useSearch();

  if (currentUser.status === "success") {
    return <Navigate to={redirect ?? "/"} />;
  }

  return (
    <Root title="Sign in" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <SignInForm />
      </div>
    </Root>
  );
};

export const Route = createFileRoute("/auth/sign-in")({
  component: AuthenticationPage,
  validateSearch: z.object({
    redirect: z.string().min(1).optional().catch(undefined),
  }),
});
