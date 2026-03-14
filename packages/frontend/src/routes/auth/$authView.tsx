import { createFileRoute } from "@tanstack/react-router";
import { AuthView } from "@daveyplate/better-auth-ui";
import { Root } from "#/pages/root";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { authView } = Route.useParams();

  return (
    <Root title="Auth" className="p-0 sm:p-5">
      <div className="grid place-items-center p-4">
        <AuthView className="" pathname={authView} />
      </div>
    </Root>
  );
}
