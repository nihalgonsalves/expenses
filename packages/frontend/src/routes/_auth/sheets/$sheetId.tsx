import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC } from "../../../api/trpc";
import { PersonalSheet } from "../../../components/personal-sheets/PersonalSheet";
import { RootLoader } from "../../../pages/Root";

const SheetDetailPage = () => {
  const { trpc } = useTRPC();

  const { sheetId } = Route.useParams();

  const result = useQuery(trpc.sheet.personalSheetById.queryOptions(sheetId));

  return (
    <RootLoader
      result={result}
      showBackButton
      getTitle={(sheet) => sheet.name}
      className="p-2 md:p-5"
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
};

export const Route = createFileRoute("/_auth/sheets/$sheetId")({
  component: SheetDetailPage,
});
