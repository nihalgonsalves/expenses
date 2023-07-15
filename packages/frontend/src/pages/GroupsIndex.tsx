import { GroupAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../api/trpc';
import { GroupsList } from '../components/GroupsList';
import { RouterLink } from '../router';

export const GroupsIndex = () => {
  const { data: groups = [] } = trpc.group.myGroups.useQuery();

  return (
    <>
      <GroupsList groups={groups} sx={{ flexGrow: 1 }} />
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
    </>
  );
};
