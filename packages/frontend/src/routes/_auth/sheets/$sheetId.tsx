import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { sheetQueries } from "../../../api/sheet";
import { PersonalSheet } from "../../../components/personal-sheets/personal-sheet";
import { RootLoader } from "../../../pages/root";

const queryOptions = (sheetId: string) =>
  sheetQueries.personalSheetById.queryOptions(sheetId);

export const Route = createFileRoute("/_auth/sheets/$sheetId")({
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

  return (
    <RootLoader
      result={result}
      showBackButton
      getTitle={(sheet) => sheet.name}
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
}
