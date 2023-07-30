import { DeleteOutline } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type Sheet } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';

import { LatestExpensesCard } from './LatestExpensesCard';

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();

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
        total={0}
        allExpensesPath={`/sheets/${personalSheet.id}/expenses`}
        addExpensePath={`/sheets/${personalSheet.id}/expenses/new`}
      >
        <Typography color="text.primary">Nothing here yet</Typography>
      </LatestExpensesCard>

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
