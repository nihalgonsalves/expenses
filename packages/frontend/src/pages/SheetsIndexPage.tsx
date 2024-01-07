import { trpc } from '../api/trpc';
import { SheetsList } from '../components/SheetsList';

import { RootLoader } from './Root';

export const SheetsIndexPage = () => {
  const result = trpc.sheet.mySheets.useQuery({ includeArchived: true });

  return (
    <RootLoader
      result={result}
      title="Sheets"
      className="p-2"
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
};
