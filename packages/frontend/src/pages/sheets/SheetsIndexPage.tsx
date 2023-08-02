import { MdPostAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { PersonalSheetsList } from '../../components/personal-sheets/PersonalSheetsList';
import { Root } from '../Root';

export const SheetsIndexPage = () => {
  const { data: sheets = [] } = trpc.sheet.myPersonalSheets.useQuery();

  return (
    <Root
      title="Personal Sheets"
      additionalChildren={
        <FloatingActionButton
          to="/sheets/new"
          label="New Sheet"
          icon={<MdPostAdd />}
        />
      }
    >
      {sheets.length > 0 && <PersonalSheetsList sheets={sheets} />}
    </Root>
  );
};
