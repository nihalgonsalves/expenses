import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";

import { useCurrentUser } from "../../api/useCurrentUser";
import { SignUpForm } from "../../components/SignUpForm";
import { Root } from "../../pages/Root";

export const Route = createFileRoute("/auth/sign-up")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().min(1).optional().catch(undefined),
  }),
});

function RouteComponent() {
  const currentUser = useCurrentUser();
  const { redirect } = Route.useSearch();

  if (currentUser.status === "success") {
    return <Navigate to={redirect ?? "/"} />;
  }

  return (
    <Root title="Sign up" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <SignUpForm />
      </div>
    </Root>
  );
}
