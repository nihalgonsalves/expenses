import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { GroupSheet } from '../../components/group-sheets/GroupSheet';
import { GroupParams, useParams } from '../../router';
import { RootLoader } from '../Root';

export const GroupDetailPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const result = trpc.sheet.groupSheetById.useQuery(groupSheetId);

  return (
    <RootLoader
      result={result}
      getTitle={(groupSheet) => groupSheet.name}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
      render={(groupSheet) => <GroupSheet groupSheet={groupSheet} />}
    />
  );
};
