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
  Typography,
  ListItem,
  Alert,
  useMediaQuery,
  type Theme,
  Checkbox,
} from '@mui/material';
import { type Dinero, allocate } from 'dinero.js';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useId,
  useState,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { addExpense, getParticipantNamesById } from '../db/splitGroup';
import {
  type SplitGroupDocument,
  type SplitGroupExpenseSplit,
} from '../db/types';
import {
  CURRENCY_CODES,
  formatCurrency,
  toMoney,
  toMoneySnapshot,
} from '../money';
import { dateTimeLocalToEpoch } from '../utils';

import { MoneyField } from './MoneyField';
import { ParticipantListItem } from './ParticipantListItem';

enum SplitGroupExpenseSplitType {
  Evenly = 'evenly',
  Selected = 'selected',
  Shares = 'shares',
  Percentage = 'percentage',
  Amounts = 'amounts',
}

const calcSplits = (
  group: SplitGroupDocument,
  money: Dinero<number>,
  ratios: Record<string, number>,
): SplitGroupExpenseSplit[] => {
  const contributors = [group.owner, ...group.participants];

  const indexedRatios = contributors.map(({ id }) => ratios[id] ?? 0);

  const allocations = indexedRatios.some((ratio) => ratio !== 0)
    ? allocate(money, indexedRatios)
    : [];

  return contributors.map(({ id }, i) => {
    const alloc = allocations[i];

    return {
      participantId: id,
      share: toMoneySnapshot(alloc ?? toMoney(0, group.currency)),
    };
  });
};

const getDefaultRatios = (group: SplitGroupDocument) =>
  Object.fromEntries(
    [group.owner, ...group.participants].map(({ id }) => [id, 1]),
  );

type SplitConfig = {
  label: string;
} & (
  | {
      expectedSum: (amount: number) => number;
      formatErrorTooHigh: (diff: number, currencyCode: string) => string;
      formatErrorTooLow: (diff: number, currencyCode: string) => string;
    }
  | { expectedSum: undefined }
) &
  (
    | {
        hasInput: true;
        inputMode: 'decimal' | 'numeric';
        unit: [singular: string, plural: string];
        ariaInputLabel: string;
      }
    | { hasInput: false }
  );

const SPLIT_CONFIG: Record<SplitGroupExpenseSplitType, SplitConfig> = {
  [SplitGroupExpenseSplitType.Evenly]: {
    expectedSum: undefined,
    label: 'Evenly',
    hasInput: false,
  },
  [SplitGroupExpenseSplitType.Selected]: {
    expectedSum: undefined,
    label: 'Select participants',
    hasInput: false,
  },
  [SplitGroupExpenseSplitType.Shares]: {
    expectedSum: undefined,
    label: 'Shares',
    hasInput: true,
    inputMode: 'numeric',
    unit: ['share', 'shares'],
    ariaInputLabel: 'Ratio',
  },
  [SplitGroupExpenseSplitType.Percentage]: {
    expectedSum: () => 100,
    formatErrorTooHigh: (diff: number) =>
      `The percentages must add up to 100%. You need to add ${diff} percent.`,
    formatErrorTooLow: (diff: number) =>
      `The percentages must add up to 100%. You need to remove ${diff} percent.`,
    label: 'Percentage',
    hasInput: true,
    inputMode: 'decimal',
    unit: ['%', '%'],
    ariaInputLabel: 'Percentage',
  },
  [SplitGroupExpenseSplitType.Amounts]: {
    expectedSum: (amount) => amount,
    formatErrorTooHigh: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You need to account for ${formatCurrency(
        toMoneySnapshot(toMoney(diff, currencyCode)),
      )}.`,
    formatErrorTooLow: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You have ${formatCurrency(
        toMoneySnapshot(toMoney(diff, currencyCode)),
      )} too much.`,
    label: 'Enter amounts',
    hasInput: false,
  },
};

const sumValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((sum, ratio) => sum + ratio, 0);

const validateSplit = (
  splitType: SplitGroupExpenseSplitType,
  ratios: Record<string, number>,
  amount: number,
) => {
  const splitConfig = SPLIT_CONFIG[splitType];

  if (splitConfig.expectedSum === undefined) {
    return sumValues(ratios) > 0;
  }

  return splitConfig.expectedSum(amount) === sumValues(ratios);
};

const CalculationHelpText = ({
  splitConfig,
  amount,
  ratios,
  currencyCode,
}: {
  splitConfig: SplitConfig;
  amount: number;
  currencyCode: string;
  ratios: Record<string, number>;
}) => {
  if (!splitConfig.expectedSum) {
    return null;
  }

  const diff = splitConfig.expectedSum(amount) - sumValues(ratios);

  return (
    <Alert
      severity={diff === 0 ? 'success' : 'warning'}
      icon={false}
      sx={{ boxSizing: 'border-box', width: '100%' }}
    >
      {diff === 0 && 'Splits are valid'}
      {diff < 0 && splitConfig.formatErrorTooLow(Math.abs(diff), currencyCode)}
      {diff > 0 && splitConfig.formatErrorTooHigh(Math.abs(diff), currencyCode)}
    </Alert>
  );
};

const SplitsFormSection = ({
  group,
  amount,
  currencyCode,
  splits,
  splitType,
  setSplitType,
  ratios,
  setRatios,
}: {
  group: SplitGroupDocument;
  amount: number;
  currencyCode: string;
  splits: SplitGroupExpenseSplit[];
  splitType: SplitGroupExpenseSplitType;
  setSplitType: (val: SplitGroupExpenseSplitType) => void;
  ratios: Record<string, number>;
  setRatios: Dispatch<SetStateAction<Record<string, number>>>;
}) => {
  const participantNamesById = getParticipantNamesById(group);

  const narrowScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('sm'),
  );

  const money = useMemo(
    () => toMoney(amount, currencyCode),
    [amount, currencyCode],
  );

  const splitValid = validateSplit(splitType, ratios, amount);

  const handleChangeRatio = useCallback(
    (participantId: string, ratio: number | string) => {
      const newRatio = typeof ratio === 'string' ? parseInt(ratio, 10) : ratio;

      setRatios(({ [participantId]: _oldRatio, ...prev }) => ({
        ...(Number.isNaN(newRatio) ? {} : { [participantId]: newRatio }),
        ...prev,
      }));
    },
    [setRatios],
  );

  const handleChangeSplitType = useCallback(
    (_e: React.MouseEvent<HTMLElement>, value: unknown) => {
      const newType = z.nativeEnum(SplitGroupExpenseSplitType).parse(value);

      switch (newType) {
        case SplitGroupExpenseSplitType.Evenly:
        case SplitGroupExpenseSplitType.Shares:
        case SplitGroupExpenseSplitType.Selected:
          setRatios(getDefaultRatios(group));
          break;

        case SplitGroupExpenseSplitType.Percentage:
          setRatios(
            100 % (group.participants.length + 1) === 0
              ? Object.fromEntries(
                  [group.owner, ...group.participants].map(({ id }) => [
                    id,
                    100 / (group.participants.length + 1),
                  ]),
                )
              : {},
          );
          break;

        case SplitGroupExpenseSplitType.Amounts:
          setRatios(
            Object.fromEntries(
              (splitValid
                ? splits
                : calcSplits(group, money, getDefaultRatios(group))
              ).map(({ participantId, share }) => [
                participantId,
                share.amount,
              ]),
            ),
          );
          break;
      }

      setSplitType(newType);
    },
    [splitValid, splits, group, money, setRatios, setSplitType],
  );

  const splitConfig = SPLIT_CONFIG[splitType];

  return (
    <>
      <ToggleButtonGroup
        color="primary"
        value={splitType}
        exclusive
        onChange={handleChangeSplitType}
        fullWidth
        orientation={narrowScreen ? 'vertical' : 'horizontal'}
      >
        {Object.entries(SPLIT_CONFIG).map(([type, { label }]) => (
          <ToggleButton key={type} value={type}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <List dense>
        {splits.map(({ participantId, share }) => (
          <ParticipantListItem
            key={participantId}
            sx={{ paddingInline: 'unset' }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <Stack>
                <Typography>
                  {participantNamesById[participantId] ?? 'Unknown'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.palette.text.secondary }}
                >
                  {splitValid ? formatCurrency(share) : '...'}
                </Typography>
              </Stack>
              {splitConfig.hasInput && (
                <TextField
                  size="small"
                  sx={{ width: '10rem' }}
                  value={ratios[participantId]}
                  onChange={(e) =>
                    handleChangeRatio(participantId, e.target.value)
                  }
                  aria-label={`${splitConfig.ariaInputLabel} for ${
                    participantNamesById[participantId] ?? 'Unknown'
                  }`}
                  InputProps={{
                    endAdornment:
                      ratios[participantId] === 1
                        ? splitConfig.unit[0]
                        : splitConfig.unit[1],
                    inputProps: { inputMode: splitConfig.inputMode },
                  }}
                />
              )}
              {splitType === SplitGroupExpenseSplitType.Amounts && (
                <MoneyField
                  size="small"
                  sx={{ width: '10rem' }}
                  currencyCode={currencyCode}
                  amount={ratios[participantId] ?? 0}
                  setAmount={(val) => handleChangeRatio(participantId, val)}
                  aria-label={`Amount for ${
                    participantNamesById[participantId] ?? 'Unknown'
                  }`}
                />
              )}
              {splitType === SplitGroupExpenseSplitType.Selected && (
                <Checkbox
                  aria-label={`Include ${
                    participantNamesById[participantId] ?? 'Unknown'
                  }`}
                  checked={ratios[participantId] === 1}
                  onChange={(_e, checked) => {
                    handleChangeRatio(participantId, checked ? 1 : 0);
                  }}
                />
              )}
            </Stack>
          </ParticipantListItem>
        ))}
        <ListItem sx={{ paddingInline: 'unset' }}>
          <CalculationHelpText
            splitConfig={splitConfig}
            ratios={ratios}
            amount={amount}
            currencyCode={currencyCode}
          />
        </ListItem>
      </List>
    </>
  );
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
    SplitGroupExpenseSplitType.Evenly,
  );
  const [ratios, setRatios] = useState(getDefaultRatios(group));
  const splits = calcSplits(group, toMoney(amount, currencyCode), ratios);

  const money = toMoney(amount, currencyCode);
  const moneySnapshot = toMoneySnapshot(money);

  const handleChangeCurrency = useCallback(
    (e: SelectChangeEvent) => {
      setCurrencyCode(e.target.value);
    },
    [setCurrencyCode],
  );
  const handleCreateExpense = async () => {
    await addExpense(group, {
      money: moneySnapshot,
      category,
      notes,
      spentAt: dateTimeLocalToEpoch(when),
      splits,
      paidById,
    });

    navigate(`/groups/${group.id}`);
  };

  const valid =
    moneySnapshot.amount > 0 && validateSplit(splitType, ratios, amount);

  return (
    <Stack
      spacing={3}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid) {
          return;
        }

        void handleCreateExpense();
      }}
    >
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
        <MoneyField
          fullWidth
          autoFocus
          label="How much did they spend?"
          currencyCode={currencyCode}
          amount={amount}
          setAmount={setAmount}
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

      <SplitsFormSection
        group={group}
        amount={amount}
        currencyCode={currencyCode}
        splits={splits}
        splitType={splitType}
        setSplitType={setSplitType}
        ratios={ratios}
        setRatios={setRatios}
      />

      <Button
        color="primary"
        variant="contained"
        startIcon={<PlaylistAdd />}
        type="submit"
        disabled={!valid}
        // TODO check why it can't be overridden normally
        sx={{ marginTop: '12px !important' }}
      >
        Add Expense
      </Button>
    </Stack>
  );
};
