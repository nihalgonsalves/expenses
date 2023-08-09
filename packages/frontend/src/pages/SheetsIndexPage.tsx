import { MdPostAdd } from 'react-icons/md';

import { trpc } from '../api/trpc';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { SheetsList } from '../components/SheetsList';

import { RootLoader } from './Root';

export const SheetsIndexPage = () => {
  const result = trpc.sheet.mySheets.useQuery();

  return (
    <RootLoader
      result={result}
      title="Sheets"
      additionalChildren={
        <FloatingActionButton
          to="/sheets/new"
          label="New Sheet"
          icon={<MdPostAdd />}
        />
      }
      render={(sheets) => <SheetsList sheets={sheets} />}
    />
  );
};
