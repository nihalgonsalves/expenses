import { GroupAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { GroupsList } from '../components/GroupsList';
import { useGroups } from '../db/splitGroup';
import { RouterLink } from '../router';

export const GroupsIndex = () => {
  const groups = useGroups();

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
