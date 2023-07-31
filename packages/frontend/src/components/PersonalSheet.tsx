import { CloudUpload, DeleteOutline } from '@mui/icons-material';
import { Button, ListItem, Stack, Typography } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  type ExpenseListItem,
  type Sheet,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { RouterLink } from '../router';
import { formatCurrency } from '../utils/money';
import { formatDateTimeRelative, getExpenseDescription } from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';
import { LatestExpensesCard } from './LatestExpensesCard';

const ExpenseListItemComponent = ({
  expense,
}: {
  expense: ExpenseListItem;
}) => {
  const descriptionText = getExpenseDescription(expense);
  return (
    <ListItem sx={{ paddingInline: 0 }}>
      <Stack direction="row" gap={1} style={{ width: '100%' }}>
        <CategoryAvatar category={expense.category} />
        <div>
          <Typography variant="body2" color="text.primary">
            <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateTimeRelative(expense.spentAt)}
          </Typography>
        </div>
      </Stack>
    </ListItem>
  );
};

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();

  const { data: personalSheetExpensesResponse } =
    trpc.expense.getPersonalSheetExpenses.useQuery({
      personalSheetId: personalSheet.id,
      limit: 2,
    });
  const { mutateAsync: deleteSheet } = trpc.sheet.deleteSheet.useMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSheet(personalSheet.id);
      void utils.sheet.personalSheetById.invalidate(personalSheet.id);
      void utils.sheet.myPersonalSheets.invalidate();
      navigate('/sheets');
    } catch (e) {
      enqueueSnackbar(
        `Error deleting sheet: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    }
  };

  return (
    <Stack spacing={2}>
      <LatestExpensesCard
        total={personalSheetExpensesResponse?.total}
        allExpensesPath={`/sheets/${personalSheet.id}/expenses`}
        addExpensePath={`/sheets/${personalSheet.id}/expenses/new`}
      >
        {personalSheetExpensesResponse?.expenses.map((expense) => (
          <ExpenseListItemComponent key={expense.id} expense={expense} />
        ))}
      </LatestExpensesCard>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<CloudUpload />}
        component={RouterLink}
        href={`/sheets/${personalSheet.id}/import`}
      >
        Import
      </Button>

      {deleteConfirm ? (
        <Stack direction="column" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setDeleteConfirm(false);
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Confirm Delete (Irreversible)
          </Button>
        </Stack>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => {
            setDeleteConfirm(true);
          }}
        >
          Delete Sheet
        </Button>
      )}
    </Stack>
  );
};
