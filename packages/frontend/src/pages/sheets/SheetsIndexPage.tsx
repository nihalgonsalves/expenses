import { PostAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../../api/trpc';
import { PersonalSheetsList } from '../../components/PersonalSheetsList';
import { RouterLink } from '../../router';
import { Root } from '../Root';

export const SheetsIndexPage = () => {
  const { data: sheets = [] } = trpc.sheet.myPersonalSheets.useQuery();

  return (
    <Root title="Personal Sheets">
      {sheets.length > 0 && (
        <PersonalSheetsList sheets={sheets} sx={{ flexGrow: 1 }} />
      )}
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<PostAdd />}
        LinkComponent={RouterLink}
        href={`/sheets/new`}
      >
        New Sheet
      </Button>
    </Root>
  );
};
