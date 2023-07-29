import { GroupAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../../api/trpc';
import { GroupSheetsList } from '../../components/GroupSheetsList';
import { RouterLink } from '../../router';
import { Root } from '../Root';

export const GroupsIndexPage = () => {
  const { data: groups = [] } = trpc.sheet.myGroupSheets.useQuery();

  return (
    <Root title="Groups">
      {groups.length > 0 && (
        <GroupSheetsList groups={groups} sx={{ flexGrow: 1 }} />
      )}
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<GroupAdd />}
        LinkComponent={RouterLink}
        href={`/groups/new`}
      >
        New Group
      </Button>
    </Root>
  );
};
