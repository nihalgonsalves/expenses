import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../api/trpc";
import { SheetsList } from "../components/SheetsList";

import { RootLoader } from "./Root";

const SheetsIndexPage = () => {
  const { trpc } = useTRPC();
  const result = useQuery(
    trpc.sheet.mySheets.queryOptions({ includeArchived: true }),
  );

  return (
    <RootLoader
      result={result}
      title="Sheets"
      className="p-2"
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
};

export default SheetsIndexPage;
