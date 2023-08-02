import { MdPlaylistAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { GroupSheet } from '../../components/group-sheets/GroupSheet';
import { GroupParams, useParams } from '../../router';
import { Root } from '../Root';

export const GroupDetailPage = () => {
  const { groupSheetId } = useParams(GroupParams);
  const {
    data: groupSheet,
    error,
    status,
  } = trpc.sheet.groupSheetById.useQuery(groupSheetId);

  if (status === 'error') {
    return (
      <Root title="Group">
        <div className="alert alert-error">{error.message}</div>
      </Root>
    );
  }

  if (status === 'loading') {
    return <Root title={null}>...</Root>;
  }

  return (
    <Root
      title={groupSheet.name}
      showBackButton
      additionalChildren={
        <FloatingActionButton
          to={`/groups/${groupSheetId}/expenses/new`}
          label="Add Expense"
          icon={<MdPlaylistAdd />}
        />
      }
    >
      <GroupSheet groupSheet={groupSheet} />
    </Root>
  );
};
