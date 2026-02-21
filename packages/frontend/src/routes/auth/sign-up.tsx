import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { SignUpForm } from "../../components/SignUpForm";
import { Root } from "../../pages/Root";

export const Route = createFileRoute("/auth/sign-up")({
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
    <Root title="Sign up" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <SignUpForm />
      </div>
    </Root>
  );
}
