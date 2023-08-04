import { MdPostAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { PersonalSheetsList } from '../../components/personal-sheets/PersonalSheetsList';
import { RootLoader } from '../Root';

export const SheetsIndexPage = () => {
  const result = trpc.sheet.myPersonalSheets.useQuery();

  return (
    <RootLoader
      result={result}
      title="Personal Sheets"
      additionalChildren={
        <FloatingActionButton
          to="/sheets/new"
          label="New Sheet"
          icon={<MdPostAdd />}
        />
      }
      render={(sheets) => <PersonalSheetsList sheets={sheets} />}
    />
  );
};
