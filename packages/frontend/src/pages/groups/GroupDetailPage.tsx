import { useMemo } from "react";

import { trpc } from "../../api/trpc";
import { useCurrentUser } from "../../api/useCurrentUser";
import type { ActorInfo } from "../../components/group-sheets/BalanceSummary";
import { GroupSheet } from "../../components/group-sheets/GroupSheet";
import { SheetParams, useParams } from "../../routes";
import { RootLoader } from "../Root";

export const GroupDetailPage = () => {
  const { sheetId } = useParams(SheetParams);

  const result = trpc.sheet.groupSheetById.useQuery(sheetId);
  const { data: me } = useCurrentUser();

  const actorInfo: ActorInfo | undefined = useMemo(
    () =>
      me && result.data
        ? {
            id: me.id,
            isAdmin:
              result.data.participants.find(({ id }) => id === me.id)?.role ===
              "ADMIN",
          }
        : undefined,
    [result.data, me],
  );

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
};
