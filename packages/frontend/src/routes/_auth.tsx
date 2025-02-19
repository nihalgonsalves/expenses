import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.errorCode === 401) {
      redirect({
        to: "/auth/sign-in",
        throw: true,
        search: location.search,
      });
    }
  },

  component: Outlet,
});
