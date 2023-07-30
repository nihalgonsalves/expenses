import { Alert, Typography } from '@mui/material';

import { trpc } from '../../api/trpc';
import { PersonalSheet } from '../../components/PersonalSheet';
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
    <Root title={sheet.name} showBackButton>
      <PersonalSheet personalSheet={sheet} />
    </Root>
  );
};
