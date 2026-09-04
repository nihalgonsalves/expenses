import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { sheetQueries } from "../../../api/sheet";
import { useCurrentUser } from "../../../api/user";
import type { ActorInfo } from "../../../components/group-sheets/balance-summary";
import { GroupSheet } from "../../../components/group-sheets/group-sheet";
import { RootLoader } from "../../../pages/root";

const queryOptions = (sheetId: string) =>
  sheetQueries.groupSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/groups/$sheetId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { sheetId } }) =>
    queryClient.query({
      ...queryOptions(sheetId),
      staleTime: "static",
    }),
});

function RouteComponent() {
  const { sheetId } = Route.useParams();

  const result = useQuery(queryOptions(sheetId));
  const me = useCurrentUser();

  const actorInfo: ActorInfo | undefined =
    me && result.data
      ? {
          id: me.id,
          isAdmin:
            result.data.participants.find(({ id }) => id === me.id)?.role ===
            "ADMIN",
        }
      : undefined;

  return (
    <RootLoader
      getTitle={(groupSheet) => groupSheet.name}
      result={result}
      render={(groupSheet) => (
        <GroupSheet actorInfo={actorInfo} groupSheet={groupSheet} />
      )}
      showBackButton
    />
  );
}
