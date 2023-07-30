import { Alert, Typography } from '@mui/material';

import { trpc } from '../../api/trpc';
import { GroupSheet } from '../../components/GroupSheet';
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
    <Root title={groupSheet.name} showBackButton>
      <GroupSheet groupSheet={groupSheet} />
    </Root>
  );
};
