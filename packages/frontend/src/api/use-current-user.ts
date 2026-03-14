import { useRouteContext } from "@tanstack/react-router";

export const useCurrentUser = () => {
  const { user } = useRouteContext({ strict: false });

  return user;
};
