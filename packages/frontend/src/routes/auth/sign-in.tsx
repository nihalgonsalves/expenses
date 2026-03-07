import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Root } from "../../pages/Root";
import { AuthView } from "@daveyplate/better-auth-ui";

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
  const { redirect: redirectParam } = Route.useSearch();

  return (
    <Root title="Sign in" className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        <AuthView pathname="/sign-in" redirectTo={redirectParam ?? "/"} />
      </div>
    </Root>
  );
}
