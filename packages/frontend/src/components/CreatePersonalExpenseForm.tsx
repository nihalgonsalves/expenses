import { LoadingButton } from '@mui/lab';
import { Alert, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type Sheet } from '@nihalgonsalves/expenses-backend';

import { useCurrencyConversion } from '../api/currencyConversion';
import { trpc } from '../api/trpc';
import { CategoryId } from '../data/categories';
import { formatCurrency, useMoneyValues } from '../utils/money';
import { dateTimeLocalToISOString, nowForDateTimeInput } from '../utils/utils';

import { CategorySelect } from './CategorySelect';
import { CurrencySelect } from './CurrencySelect';
import { MoneyField } from './MoneyField';

export const CreatePersonalExpenseForm = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [currencyCode, setCurrencyCode] = useState(personalSheet.currencyCode);
  const [category, setCategory] = useState<CategoryId>();
  const [description, setDescription] = useState('');
  const [spentAt, setSpentAt] = useState(nowForDateTimeInput());

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const utils = trpc.useContext();
  const {
    mutateAsync: createPersonalSheetExpense,
    isLoading,
    error,
  } = trpc.expense.createPersonalSheetExpense.useMutation();

  const valid = amount > 0;

  const handleCreateExpense = async () => {
    await createPersonalSheetExpense({
      personalSheetId: personalSheet.id,
      money: convertedMoneySnapshot ?? moneySnapshot,
      category: category ?? CategoryId.Other,
      description,
      spentAt: dateTimeLocalToISOString(spentAt),
    });

    await utils.expense.getPersonalSheetExpenses.invalidate({
      personalSheetId: personalSheet.id,
    });

    navigate(`/sheets/${personalSheet.id}`);
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error.message}</Alert>}

      <Stack direction="row" spacing={1}>
        <MoneyField
          fullWidth
          autoFocus
          label="Amount"
          currencyCode={currencyCode}
          amount={amount}
          setAmount={setAmount}
          helperText={
            convertedMoneySnapshot
              ? formatCurrency(convertedMoneySnapshot)
              : null
          }
        />

        {supportedCurrencies.includes(personalSheet.currencyCode) && (
          <CurrencySelect
            options={supportedCurrencies}
            currencyCode={currencyCode}
            setCurrencyCode={setCurrencyCode}
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        )}
      </Stack>

      <CategorySelect category={category} setCategory={setCategory} />

      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
        }}
      />

      <TextField
        fullWidth
        label="Date & Time"
        type="datetime-local"
        value={spentAt}
        onChange={(e) => {
          setSpentAt(e.target.value);
        }}
      />

      <LoadingButton
        disabled={!valid}
        variant="contained"
        loading={isLoading}
        onClick={handleCreateExpense}
      >
        Create
      </LoadingButton>
    </Stack>
  );
};
