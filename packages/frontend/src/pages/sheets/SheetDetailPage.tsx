import { trpc } from "../../api/trpc";
import { PersonalSheet } from "../../components/personal-sheets/PersonalSheet";
import { useParams, SheetParams } from "../../routes";
import { RootLoader } from "../Root";

export const SheetDetailPage = () => {
  const { sheetId } = useParams(SheetParams);
  const result = trpc.sheet.personalSheetById.useQuery(sheetId);

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
