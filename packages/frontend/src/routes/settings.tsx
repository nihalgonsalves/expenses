import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Root } from "../pages/root";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
    if (
      context.user == null &&
      location.pathname !== "/settings/troubleshooting"
    ) {
      throw redirect({
        to: "/settings/$section",
        params: { section: "troubleshooting" },
      });
    }
  },
});

function RouteComponent() {
  return (
    <Root title="Settings" showBackButton>
      <Outlet />
    </Root>
  );
}
