import { PlaylistAdd } from '@mui/icons-material';
import { Button } from '@mui/material';

import { trpc } from '../../../api/trpc';
import { PersonalSheetExpensesExpandedList } from '../../../components/PersonalSheetExpenseExpandedList';
import { PersonalSheetParams, RouterLink, useParams } from '../../../router';
import { Root } from '../../Root';

export const PersonalExpensesIndexPage = () => {
  const { sheetId } = useParams(PersonalSheetParams);
  const { data: personalSheetExpenses } =
    trpc.expense.getPersonalSheetExpenses.useQuery({
      personalSheetId: sheetId,
    });

  if (!personalSheetExpenses) return null;

  return (
    <Root title="Expenses" showBackButton>
      <PersonalSheetExpensesExpandedList
        personalSheetId={sheetId}
        expenses={personalSheetExpenses.expenses}
      />
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<PlaylistAdd />}
        LinkComponent={RouterLink}
        href={`/sheets/${sheetId}/expenses/new`}
      >
        Add Expense
      </Button>
    </Root>
  );
};
