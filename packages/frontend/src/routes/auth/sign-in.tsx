import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Root } from "../../pages/root";
import { AuthView } from "@daveyplate/better-auth-ui";
import { useEffect, useEffectEvent } from "react";
import { authClient } from "#/utils/auth";
import { useInvalidateRouter } from "#/api/use-invalidate-router";

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
  const invalidateRouter = useInvalidateRouter();

  const signInPasskey = useEffectEvent(async () => {
    if (
      // browser / context (HTTPS) check
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      await globalThis.PublicKeyCredential?.isConditionalMediationAvailable?.()
    ) {
      await authClient.signIn.passkey({ autoFill: true });
      await invalidateRouter();
    }
  });

  useEffect(() => {
    void signInPasskey();
  }, []);

  return (
    <Root title="Sign in" className="p-0 sm:p-5">
      <div className="grid place-items-center p-4">
        <AuthView pathname="/sign-in" redirectTo={redirectParam ?? "/"} />
      </div>
    </Root>
  );
}
