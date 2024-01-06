import { PlusIcon } from '@radix-ui/react-icons';

import { trpc } from '../api/trpc';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { NewSheetDialog } from '../components/NewSheetDialog';
import { SheetsList } from '../components/SheetsList';

import { RootLoader } from './Root';

export const SheetsIndexPage = () => {
  const result = trpc.sheet.mySheets.useQuery({ includeArchived: true });

  return (
    <RootLoader
      result={result}
      title="Sheets"
      className="p-2"
      additionalChildren={
        <NewSheetDialog
          trigger={
            <FloatingActionButton label="New Sheet" icon={<PlusIcon />} />
          }
        />
      }
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
};
