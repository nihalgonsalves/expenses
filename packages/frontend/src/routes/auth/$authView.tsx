import { createFileRoute } from "@tanstack/react-router";
import { AuthView } from "@daveyplate/better-auth-ui";
import { Root } from "#/pages/Root";

export const Route = createFileRoute("/auth/$authView")({
  component: RouteComponent,
});

function RouteComponent() {
  const { authView } = Route.useParams();

  return (
    <Root title="Auth" className="p-0 sm:p-5">
      <div className="m-auto size-full p-4 sm:grid sm:max-w-xl sm:place-items-center">
        <AuthView pathname={authView} />
      </div>
    </Root>
  );
}
