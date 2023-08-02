import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { PersonalSheet } from '../../components/personal-sheets/PersonalSheet';
import { useParams, PersonalSheetParams } from '../../router';
import { Root } from '../Root';

export const SheetDetailPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const {
    data: sheet,
    error,
    status,
  } = trpc.sheet.personalSheetById.useQuery(sheetId);

  if (status === 'error') {
    return (
      <Root title="Personal Sheet">
        <div className="alert alert-error">{error.message}</div>
      </Root>
    );
  }

  if (status === 'loading') {
    return <Root title={null}>...</Root>;
  }

  return (
    <Root
      title={sheet.name}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/sheets/${sheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
    >
      <PersonalSheet personalSheet={sheet} />
    </Root>
  );
};
