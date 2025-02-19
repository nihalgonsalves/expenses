import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/groups/")({
  loader: () => {
    redirect({
      to: "/sheets",
      throw: true,
    });
  },
});
