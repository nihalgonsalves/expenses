import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { PersonalSheet } from '../../components/personal-sheets/PersonalSheet';
import { useParams, PersonalSheetParams } from '../../router';
import { RootLoader } from '../Root';

export const SheetDetailPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const result = trpc.sheet.personalSheetById.useQuery(sheetId);

  return (
    <RootLoader
      result={result}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
      getTitle={(sheet) => sheet.name}
      render={(sheet) => <PersonalSheet personalSheet={sheet} />}
    />
  );
};
