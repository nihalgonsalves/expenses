import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { useCurrentUser } from "../../../api/useCurrentUser";
import type { ActorInfo } from "../../../components/group-sheets/BalanceSummary";
import { GroupSheet } from "../../../components/group-sheets/GroupSheet";
import { RootLoader } from "../../../pages/Root";

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
  const { data: me } = useCurrentUser();

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
      className="p-2 md:p-5"
      render={(groupSheet) => (
        <GroupSheet actorInfo={actorInfo} groupSheet={groupSheet} />
      )}
      showBackButton
    />
  );
}
