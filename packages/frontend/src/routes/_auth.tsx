import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { usePrefetchQueries } from "#/api/usePrefetchQueries";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
  beforeLoad: async ({ context: { user }, location }) => {
    if (user == null) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
});

function RouteComponent() {
  usePrefetchQueries();

  return <Outlet />;
}
