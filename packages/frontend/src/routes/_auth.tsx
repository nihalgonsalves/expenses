import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";

import { useCurrentUser } from "../api/useCurrentUser";

const Component = () => {
  const currentUser = useCurrentUser();

  if (currentUser.error?.data?.httpStatus === 401) {
    return (
      <Navigate to="/auth/sign-in" search={{ redirect: location.pathname }} />
    );
  }

  return <Outlet />;
};

export const Route = createFileRoute("/_auth")({
  component: Component,
});
