import { AddCircle } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { getCurrencyCode } from '../utils/money';

import { CurrencySelect } from './CurrencySelect';

export const CreateSheetForm = () => {
  const navigate = useNavigate();

  const {
    mutateAsync: createSheet,
    isLoading,
    error,
  } = trpc.sheet.createPersonalSheet.useMutation();

  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(getCurrencyCode());

  const handleCreateSheet = async () => {
    const { id } = await createSheet({
      name,
      currencyCode,
    });
    navigate(`/sheets/${id}`);
  };

  const valid = name;

  return (
    <form>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error.message}</Alert>}

        <TextField
          fullWidth
          label="Sheet name"
          placeholder="Personal Expenses"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />

        <CurrencySelect
          fullWidth
          currencyCode={currencyCode}
          setCurrencyCode={setCurrencyCode}
        />

        <LoadingButton
          fullWidth
          variant="contained"
          startIcon={<AddCircle />}
          onClick={handleCreateSheet}
          disabled={!valid}
          loading={isLoading}
        >
          Create Sheet
        </LoadingButton>
      </Stack>
    </form>
  );
};
