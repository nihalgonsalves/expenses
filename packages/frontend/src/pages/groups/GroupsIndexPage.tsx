import { MdGroupAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { FloatingActionButton } from '../../components/FloatingActionnButton';
import { GroupSheetsList } from '../../components/group-sheets/GroupSheetsList';
import { RootLoader } from '../Root';

export const GroupsIndexPage = () => {
  const result = trpc.sheet.myGroupSheets.useQuery();

  return (
    <RootLoader
      result={result}
      title="Groups"
      additionalChildren={
        <FloatingActionButton
          to="/groups/new"
          label="New Group"
          icon={<MdGroupAdd />}
        />
      }
      render={(groupSheets) => <GroupSheetsList groupSheets={groupSheets} />}
    />
  );
};
