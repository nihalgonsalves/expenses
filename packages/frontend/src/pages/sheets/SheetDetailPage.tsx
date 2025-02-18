import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../api/trpc";
import { PersonalSheet } from "../../components/personal-sheets/PersonalSheet";
import { useParams, SheetParams } from "../../routes";
import { RootLoader } from "../Root";

const SheetDetailPage = () => {
  const { trpc } = useTRPC();

  const { sheetId } = useParams(SheetParams);
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

export default SheetDetailPage;
