import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { SignInForm } from "../../components/SignInForm";
import { Root } from "../../pages/Root";

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().min(1).optional().catch(undefined),
  }),
  beforeLoad: ({ context: { user }, search }) => {
    if (user != null) {
      throw redirect({
        to: search.redirect ?? "/",
      });
    }
  },
});

function RouteComponent() {
  return (
    <Root title="Sign in" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <SignInForm />
      </div>
    </Root>
  );
}
