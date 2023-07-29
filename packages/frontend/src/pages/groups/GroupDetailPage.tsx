import { Alert, Typography } from '@mui/material';

import { trpc } from '../../api/trpc';
import { Group } from '../../components/Group';
import { GroupParams, useParams } from '../../router';
import { Root } from '../Root';

export const GroupDetailPage = () => {
  const { groupId } = useParams(GroupParams);
  const {
    data: group,
    error,
    status,
  } = trpc.sheet.groupSheetById.useQuery(groupId);

  if (status === 'error') {
    return (
      <Root title="Group">
        <Alert severity="error">{error.message}</Alert>
      </Root>
    );
  }

  if (status === 'loading') {
    return (
      <Root title={null}>
        <Typography color="text.primary">...</Typography>
      </Root>
    );
  }

  return (
    <Root title={group.name} showBackButton>
      <Group group={group} />
    </Root>
  );
};
