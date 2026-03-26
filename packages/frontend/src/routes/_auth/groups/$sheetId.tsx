import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { useCurrentUser } from "../../../api/use-current-user";
import type { ActorInfo } from "../../../components/group-sheets/balance-summary";
import { GroupSheet } from "../../../components/group-sheets/group-sheet";
import { RootLoader } from "../../../pages/root";

const queryOptions = (context: QueryOptionsContext, sheetId: string) =>
  context.trpc.sheet.groupSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/groups/$sheetId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc }, params: { sheetId } }) =>
    queryClient.ensureQueryData(queryOptions({ trpc }, sheetId)),
});

function RouteComponent() {
  const { trpc } = useTRPC();
  const { sheetId } = Route.useParams();

  const result = useQuery(queryOptions({ trpc }, sheetId));
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
