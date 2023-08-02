import { MdGroupAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { GroupSheetsList } from '../../components/group-sheets/GroupSheetsList';
import { Root } from '../Root';

export const GroupsIndexPage = () => {
  const { data: groupSheets = [] } = trpc.sheet.myGroupSheets.useQuery();

  return (
    <Root
      title="Groups"
      additionalChildren={
        <FloatingActionButton
          to="/groups/new"
          label="New Group"
          icon={<MdGroupAdd />}
        />
      }
    >
      {groupSheets.length > 0 && <GroupSheetsList groupSheets={groupSheets} />}
    </Root>
  );
};
