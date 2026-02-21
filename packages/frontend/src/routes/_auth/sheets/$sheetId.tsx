import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC, type QueryOptionsContext } from "../../../api/trpc";
import { PersonalSheet } from "../../../components/personal-sheets/PersonalSheet";
import { RootLoader } from "../../../pages/Root";

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
      className="p-2 md:p-5"
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
}
