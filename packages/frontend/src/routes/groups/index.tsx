import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/groups/")({
  loader: () => {
    redirect({
      to: "/sheets",
      throw: true,
    });
  },
});
