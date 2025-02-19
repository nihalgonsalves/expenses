import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { z } from "zod";

import { useCurrentUser } from "../../api/useCurrentUser";
import { SignUpForm } from "../../components/SignUpForm";
import { Root } from "../../pages/Root";

const SignUpPage = () => {
  const { redirect: redirectParam } = useSearch({ from: "/auth/sign-up" });

  const { data, error } = useCurrentUser();

  if (data?.id && !error) {
    redirect({ to: redirectParam ?? "/", replace: true, throw: true });
  }

  return (
    <Root title="Sign up" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <SignUpForm />
      </div>
    </Root>
  );
};

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
  validateSearch: z.object({
    redirect: z.string().min(1).optional().catch(undefined),
  }),
});
