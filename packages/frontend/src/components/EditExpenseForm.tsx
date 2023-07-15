import { Temporal } from '@js-temporal/polyfill';
import { PlaylistAdd } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
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

import {
  type Money,
  type GroupByIdResponse,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import {
  CURRENCY_CODES,
  formatCurrency,
  toDinero,
  toMoney,
} from '../utils/money';
import { dateTimeLocalToISOString } from '../utils/utils';

import { MoneyField } from './MoneyField';
import { ParticipantListItem } from './ParticipantListItem';

type SplitGroupExpenseSplit = {
  participantId: string;
  participantName: string;
  share: Money;
};

enum SplitGroupExpenseSplitType {
  Evenly = 'evenly',
  Selected = 'selected',
  Shares = 'shares',
  Percentage = 'percentage',
  Amounts = 'amounts',
}

const calcSplits = (
  group: GroupByIdResponse,
  money: Dinero<number>,
  ratios: Record<string, number>,
): SplitGroupExpenseSplit[] => {
  const indexedRatios = group.participants.map(({ id }) => ratios[id] ?? 0);

  const allocations = indexedRatios.some((ratio) => ratio !== 0)
    ? allocate(money, indexedRatios)
    : [];

  return group.participants.map(({ id, name }, i) => {
    const alloc = allocations[i];

    return {
      participantId: id,
      participantName: name,
      share: toMoney(alloc ?? toDinero(0, group.defaultCurrency)),
    };
  });
};

const getDefaultRatios = (group: GroupByIdResponse) =>
  Object.fromEntries(group.participants.map(({ id }) => [id, 1]));

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
        toMoney(toDinero(diff, currencyCode)),
      )}.`,
    formatErrorTooLow: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You have ${formatCurrency(
        toMoney(toDinero(diff, currencyCode)),
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
  group: GroupByIdResponse;
  amount: number;
  currencyCode: string;
  splits: SplitGroupExpenseSplit[];
  splitType: SplitGroupExpenseSplitType;
  setSplitType: (val: SplitGroupExpenseSplitType) => void;
  ratios: Record<string, number>;
  setRatios: Dispatch<SetStateAction<Record<string, number>>>;
}) => {
  const narrowScreen = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('sm'),
  );

  const money = useMemo(
    () => toDinero(amount, currencyCode),
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
            100 % group.participants.length === 0
              ? Object.fromEntries(
                  group.participants.map(({ id }) => [
                    id,
                    100 / group.participants.length,
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
        {splits.map(({ participantId, participantName, share }) => (
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
                <Typography>{participantName}</Typography>
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
                  aria-label={`${splitConfig.ariaInputLabel} for ${participantName}`}
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
                  aria-label={`Amount for ${participantName}`}
                />
              )}
              {splitType === SplitGroupExpenseSplitType.Selected && (
                <Checkbox
                  aria-label={`Include ${participantName}`}
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

export const EditExpenseForm = ({ group }: { group: GroupByIdResponse }) => {
  const paidByIdSelectId = useId();
  const categorySelectId = useId();

  const createExpense = trpc.expense.createExpense.useMutation();

  const navigate = useNavigate();

  const [paidById, setPaidById] = useState(group.participants[0]?.id);
  const [currencyCode, setCurrencyCode] = useState(group.defaultCurrency);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(
    Temporal.Now.plainDateTimeISO().round('minutes').toString(),
  );

  const [splitType, setSplitType] = useState<SplitGroupExpenseSplitType>(
    SplitGroupExpenseSplitType.Evenly,
  );
  const [ratios, setRatios] = useState(getDefaultRatios(group));
  const splits = calcSplits(group, toDinero(amount, currencyCode), ratios);

  const money = toDinero(amount, currencyCode);
  const moneySnapshot = toMoney(money);

  const handleChangeCurrency = useCallback(
    (e: SelectChangeEvent) => {
      setCurrencyCode(e.target.value);
    },
    [setCurrencyCode],
  );

  const handleCreateExpense = async () => {
    if (!paidById) {
      return;
    }

    await createExpense.mutateAsync({
      groupId: group.id,
      paidById,
      description,
      money: moneySnapshot,
      spentAt: dateTimeLocalToISOString(when),
      splits,
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
      {createExpense.error && (
        <Alert severity="error">{createExpense.error.message}</Alert>
      )}

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
          {Object.values(group.participants).map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
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
        label="Description"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
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

      <LoadingButton
        loading={createExpense.isLoading}
        color="primary"
        variant="contained"
        startIcon={<PlaylistAdd />}
        type="submit"
        disabled={!valid}
        // TODO check why it can't be overridden normally
        sx={{ marginTop: '12px !important' }}
      >
        Add Expense
      </LoadingButton>
    </Stack>
  );
};
