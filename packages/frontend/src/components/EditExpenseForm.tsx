import { Temporal } from '@js-temporal/polyfill';
import { PlaylistAdd } from '@mui/icons-material';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { addExpense } from '../db/splitGroup';
import { type SplitGroupDocument } from '../db/types';
import { CURRENCY_CODES, formatCurrency, toMoneySnapshot } from '../money';
import { dateTimeLocalToEpoch, getUserLanguage } from '../utils';

const stringInputToInt = (val: string) => {
  const digits = val.replace(/[^0-9]/g, '');

  return digits === '' ? 0 : parseInt(digits);
};

export const EditExpenseForm = ({ group }: { group: SplitGroupDocument }) => {
  const categorySelectId = useId();
  const navigate = useNavigate();

  const [currencyCode, setCurrencyCode] = useState(group.currency);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState(
    Temporal.Now.plainDateTimeISO().round('minutes').toString(),
  );

  const money = toMoneySnapshot(amount, currencyCode);

  const handleChangeCurrency = (e: SelectChangeEvent) => {
    setCurrencyCode(e.target.value);
  };

  const handleChangeAmount: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    setAmount(stringInputToInt(e.target.value));
  };

  const handleCreateExpense = async () => {
    await addExpense(group, {
      money,
      category,
      notes,
      spentAt: dateTimeLocalToEpoch(when),
    });

    navigate(`/groups/${group.id}`);
  };

  const valid = money.amount > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid) {
          return;
        }

        void handleCreateExpense();
      }}
    >
      <Stack spacing={3}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            autoFocus
            label="How much did you spend?"
            InputProps={{ endAdornment: formatCurrency(money) }}
            inputProps={{ inputMode: 'numeric' }}
            placeholder={new Intl.NumberFormat(getUserLanguage()).format(12.34)}
            value={amount}
            onChange={handleChangeAmount}
          />
          <Select value={currencyCode} onChange={handleChangeCurrency}>
            {Object.values(CURRENCY_CODES).map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <FormControl fullWidth>
          <InputLabel id={categorySelectId}>Category</InputLabel>
          <Select
            labelId={categorySelectId}
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
            }}
          >
            <MenuItem value="food">Food</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
          }}
        />

        <TextField
          fullWidth
          label="When?"
          type="datetime-local"
          value={when}
          onChange={(e) => {
            setWhen(e.target.value);
          }}
        />

        <Button
          color="primary"
          variant="contained"
          startIcon={<PlaylistAdd />}
          type="submit"
          disabled={!valid}
        >
          Add Expense
        </Button>
      </Stack>
    </form>
  );
};
