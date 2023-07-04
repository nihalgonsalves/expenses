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
  ToggleButtonGroup,
  ToggleButton,
  List,
} from '@mui/material';
import { type Dinero, allocate } from 'dinero.js';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { addExpense, getParticipantNamesById } from '../db/splitGroup';
import {
  SplitGroupExpenseSplitType,
  type SplitGroupDocument,
  ZSplitGroupExpenseSplitType,
  type SplitGroupExpenseSplit,
} from '../db/types';
import {
  CURRENCY_CODES,
  formatCurrency,
  toMoney,
  toMoneySnapshot,
} from '../money';
import { dateTimeLocalToEpoch, getUserLanguage } from '../utils';

import { ParticipantListItem } from './ParticipantListItem';

const stringInputToInt = (val: string) => {
  const digits = val.replace(/[^0-9]/g, '');

  return digits === '' ? 0 : parseInt(digits);
};

const calcSplitEqually = (
  group: SplitGroupDocument,
  money: Dinero<number>,
): SplitGroupExpenseSplit[] => {
  const allocations = allocate(
    money,
    Array.from({ length: group.participants.length + 1 }).map(() => 1),
  );

  return [group.owner, ...group.participants].map(({ id }, i) => {
    const share = allocations[i];

    if (!share) {
      throw new Error('Unexpected missing share');
    }

    return {
      participantId: id,
      share: toMoneySnapshot(share),
    };
  });
};

const calcSplits = (
  group: SplitGroupDocument,
  money: Dinero<number>,
  splitBy: SplitGroupExpenseSplitType,
): SplitGroupExpenseSplit[] => {
  switch (splitBy) {
    case SplitGroupExpenseSplitType.Equal:
      return calcSplitEqually(group, money);
  }

  throw new Error('Not Implemented');
};

export const EditExpenseForm = ({ group }: { group: SplitGroupDocument }) => {
  const paidByIdSelectId = useId();
  const categorySelectId = useId();
  const navigate = useNavigate();

  const [paidById, setPaidById] = useState(group.owner.id);
  const [currencyCode, setCurrencyCode] = useState(group.currency);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState(
    Temporal.Now.plainDateTimeISO().round('minutes').toString(),
  );
  const [splitType, setSplitType] = useState<SplitGroupExpenseSplitType>(
    SplitGroupExpenseSplitType.Equal,
  );

  const money = toMoney(amount, currencyCode);
  const moneySnapshot = toMoneySnapshot(money);

  const splits = calcSplits(group, money, splitType);

  const participantNamesById = getParticipantNamesById(group);

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
      money: moneySnapshot,
      category,
      notes,
      spentAt: dateTimeLocalToEpoch(when),
      splitType,
      splits,
      paidById,
    });

    navigate(`/groups/${group.id}`);
  };

  const valid = moneySnapshot.amount > 0;

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
        <FormControl fullWidth>
          <InputLabel id={paidByIdSelectId}>Who paid?</InputLabel>
          <Select
            labelId={paidByIdSelectId}
            label="Who paid?"
            value={paidById}
            onChange={(e) => {
              setPaidById(e.target.value);
            }}
          >
            {Object.values([group.owner, ...group.participants]).map(
              ({ id, name }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            autoFocus
            label="How much did you spend?"
            InputProps={{ endAdornment: formatCurrency(moneySnapshot) }}
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

        <ToggleButtonGroup
          color="primary"
          value={splitType}
          exclusive
          onChange={(_e, value) => {
            setSplitType(ZSplitGroupExpenseSplitType.parse(value));
          }}
          fullWidth
          orientation="vertical"
        >
          <ToggleButton value={SplitGroupExpenseSplitType.Equal}>
            Split Equally
          </ToggleButton>
        </ToggleButtonGroup>

        <List dense>
          {splits.map(({ participantId, share }) => (
            <ParticipantListItem
              key={participantId}
              primary={participantNamesById[participantId] ?? 'Unknown'}
              secondary={formatCurrency(share)}
            />
          ))}
        </List>

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
