import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";

import { useCurrentUser } from "../api/useCurrentUser";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
});

function RouteComponent() {
  const currentUser = useCurrentUser();

  if (currentUser.error?.data?.httpStatus === 401) {
    return (
      <Navigate
        to="/auth/sign-in"
        search={{
          // TODO: using useLocation ends up in a circular redirect param
          // eslint-disable-next-line no-restricted-globals
          redirect: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
