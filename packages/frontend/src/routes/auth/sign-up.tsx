import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Root } from "../../pages/root";
import { AuthView } from "@daveyplate/better-auth-ui";

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
  const { redirect: redirectParam } = Route.useSearch();

  return (
    <Root title="Sign up" className="p-0 sm:p-5">
      <div className="grid place-items-center p-4">
        <AuthView pathname="/sign-up" redirectTo={redirectParam ?? "/"} />
      </div>
    </Root>
  );
}
