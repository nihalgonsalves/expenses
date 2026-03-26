import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { PersonalSheet } from "../../../components/personal-sheets/personal-sheet";
import { RootLoader } from "../../../pages/root";

const queryOptions = (context: QueryOptionsContext, sheetId: string) =>
  context.trpc.sheet.personalSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/sheets/$sheetId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc }, params: { sheetId } }) =>
    queryClient.ensureQueryData(queryOptions({ trpc }, sheetId)),
});

function RouteComponent() {
  const { trpc } = useTRPC();

  const { sheetId } = Route.useParams();

  const result = useQuery(queryOptions({ trpc }, sheetId));

  return (
    <RootLoader
      result={result}
      showBackButton
      getTitle={(sheet) => sheet.name}
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
}
