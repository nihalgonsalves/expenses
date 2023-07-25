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
  Checkbox,
  ListItemIcon,
  Collapse,
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
  dineroToMoney,
  zeroMoney,
  type User,
} from '@nihalgonsalves/expenses-backend';
import { moneyToDinero } from '@nihalgonsalves/expenses-backend/src/money';

import { trpc } from '../api/trpc';
import { CategoryId, categories } from '../data/categories';
import { useToggleButtonOrientation } from '../utils/hooks';
import {
  convertCurrency,
  formatCurrency,
  formatDecimalCurrency,
  toDinero,
} from '../utils/money';
import { dateTimeLocalToISOString, getInitials } from '../utils/utils';

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
  currencyCode: string,
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
      share: alloc ? dineroToMoney(alloc) : zeroMoney(currencyCode),
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
      `The amounts must add up to the total. You need to account for ${formatDecimalCurrency(
        diff,
        currencyCode,
      )}.`,
    formatErrorTooLow: (diff: number, currencyCode: string) =>
      `The amounts must add up to the total. You have ${formatDecimalCurrency(
        diff,
        currencyCode,
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
  rate,
}: {
  group: GroupByIdResponse;
  amount: number;
  currencyCode: string;
  splits: SplitGroupExpenseSplit[];
  splitType: SplitGroupExpenseSplitType;
  setSplitType: (val: SplitGroupExpenseSplitType) => void;
  ratios: Record<string, number>;
  setRatios: Dispatch<SetStateAction<Record<string, number>>>;
  rate: { amount: number; scale: number } | undefined;
}) => {
  const toggleButtonOrientation = useToggleButtonOrientation('sm');

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
      if (!value) {
        return;
      }

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
                : calcSplits(
                    group,
                    currencyCode,
                    money,
                    getDefaultRatios(group),
                  )
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
    [splitValid, splits, group, currencyCode, money, setRatios, setSplitType],
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
        orientation={toggleButtonOrientation}
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
            disablePadding={false}
            avatar={getInitials(participantName)}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <Stack>
                <Typography color="text.primary">{participantName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {splitValid ? (
                    <>
                      {formatCurrency(share)}
                      {group.currencyCode !== currencyCode &&
                        rate &&
                        ` (${formatCurrency(
                          convertCurrency(share, group.currencyCode, rate),
                        )})`}
                    </>
                  ) : (
                    '...'
                  )}
                </Typography>
              </Stack>
              {splitConfig.hasInput && (
                <TextField
                  size="small"
                  sx={{ width: '10rem' }}
                  value={ratios[participantId]}
                  onChange={(e) => {
                    handleChangeRatio(participantId, e.target.value);
                  }}
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
                  setAmount={(val) => {
                    handleChangeRatio(participantId, val);
                  }}
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

const ParticipantSelect = ({
  group,
  label,
  selectedId,
  setSelectedId,
  filterId,
}: {
  group: GroupByIdResponse;
  label: string;
  selectedId: string | undefined;
  setSelectedId: (val: string) => void;
  filterId?: (val: string) => boolean;
}) => {
  const selectId = useId();

  const options = filterId
    ? Object.values(group.participants).filter(({ id }) => filterId(id))
    : Object.values(group.participants);

  return (
    <FormControl fullWidth>
      <InputLabel id={selectId}>{label}</InputLabel>
      <Select
        labelId={selectId}
        label={label}
        value={selectedId ?? ''}
        onChange={(e) => {
          setSelectedId(e.target.value);
        }}
      >
        {options.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export const RegularExpenseForm = ({
  group,
  me,
}: {
  group: GroupByIdResponse;
  me: User;
}) => {
  const categorySelectId = useId();
  const currencySelectId = useId();

  const createExpense = trpc.expense.createExpense.useMutation();

  const navigate = useNavigate();

  const [paidById, setPaidById] = useState(me.id);
  const [currencyCode, setCurrencyCode] = useState(group.currencyCode);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<CategoryId>();
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(
    Temporal.Now.plainDateTimeISO().round('minutes').toString(),
  );

  const { data: supportedCurrencies = [] } =
    trpc.currencyConversion.getSupportedCurrencies.useQuery();

  const { data: rate } = trpc.currencyConversion.getConversionRate.useQuery(
    {
      from: currencyCode,
      to: group.currencyCode,
    },
    { enabled: group.currencyCode !== currencyCode },
  );

  const dineroValue = toDinero(amount, currencyCode);

  const [splitType, setSplitType] = useState<SplitGroupExpenseSplitType>(
    SplitGroupExpenseSplitType.Evenly,
  );
  const [ratios, setRatios] = useState(getDefaultRatios(group));
  const splits = calcSplits(group, currencyCode, dineroValue, ratios);

  const moneySnapshot: Money = dineroToMoney(dineroValue);
  const convertedMoneySnapshot =
    group.currencyCode !== currencyCode && rate
      ? convertCurrency(moneySnapshot, group.currencyCode, rate)
      : undefined;

  const handleChangeCurrency = useCallback(
    (e: SelectChangeEvent) => {
      setCurrencyCode(e.target.value);
    },
    [setCurrencyCode],
  );

  const valid =
    moneySnapshot.amount > 0 && validateSplit(splitType, ratios, amount);

  const handleCreateExpense = async () => {
    if (!valid) {
      return;
    }

    if (group.currencyCode === currencyCode) {
      await createExpense.mutateAsync({
        groupId: group.id,
        paidById,
        description,
        category: category ?? CategoryId.Other,
        money: moneySnapshot,
        spentAt: dateTimeLocalToISOString(when),
        splits,
      });
    } else if (convertedMoneySnapshot && rate) {
      await createExpense.mutateAsync({
        groupId: group.id,
        paidById,
        description,
        category: category ?? CategoryId.Other,
        money: convertedMoneySnapshot,
        spentAt: dateTimeLocalToISOString(when),
        splits: calcSplits(
          group,
          currencyCode,
          moneyToDinero(convertedMoneySnapshot),
          ratios,
        ),
      });
    }

    navigate(`/groups/${group.id}`);
  };

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

      <Stack direction="row" spacing={1}>
        <MoneyField
          fullWidth
          autoFocus
          label="How much was spent?"
          currencyCode={currencyCode}
          amount={amount}
          setAmount={setAmount}
          helperText={
            <Collapse component="span" in={group.currencyCode !== currencyCode}>
              {convertedMoneySnapshot ? (
                formatCurrency(convertedMoneySnapshot)
              ) : (
                <>&nbsp;</>
              )}
            </Collapse>
          }
        />
        {supportedCurrencies.includes(group.currencyCode) && (
          <FormControl variant="outlined" sx={{ flexShrink: 0 }}>
            <InputLabel id={currencySelectId}>Currency</InputLabel>

            <Select
              id={currencySelectId}
              value={currencyCode}
              onChange={handleChangeCurrency}
              label="Currency"
            >
              {supportedCurrencies.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <ParticipantSelect
        group={group}
        label="Who paid?"
        selectedId={paidById}
        setSelectedId={(newId) => {
          if (!newId) return;

          setPaidById(newId);
        }}
      />

      <FormControl fullWidth>
        <InputLabel id={categorySelectId}>Category</InputLabel>
        <Select
          labelId={categorySelectId}
          label="Category"
          value={category ?? ''}
          onChange={(e) => {
            setCategory(
              e.target.value
                ? z.nativeEnum(CategoryId).parse(e.target.value)
                : undefined,
            );
          }}
          SelectDisplayProps={{ style: { display: 'flex', gap: '0.5rem' } }}
        >
          <MenuItem value="">No Category</MenuItem>
          {categories.map(({ id, name, icon }) => (
            <MenuItem key={id} value={id}>
              <ListItemIcon sx={{ minWidth: 'unset' }}>{icon}</ListItemIcon>
              {name}
            </MenuItem>
          ))}
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
        rate={rate}
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

export const SettlementForm = ({
  group,
  me,
}: {
  group: GroupByIdResponse;
  me: User;
}) => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [fromId, setFromId] = useState<string | undefined>(me.id);
  const [toId, setToId] = useState<string | undefined>();

  const utils = trpc.useContext();
  const createSettlement = trpc.expense.createSettlement.useMutation();

  const valid = fromId && toId && fromId !== toId && amount > 0;

  const handleCreateSettlement = async () => {
    if (!fromId || !toId) {
      return;
    }

    await createSettlement.mutateAsync({
      groupId: group.id,
      fromId,
      toId,
      money: dineroToMoney(toDinero(amount, group.currencyCode)),
    });

    await Promise.all([
      utils.expense.getExpenses.invalidate({ groupId: group.id }),
      utils.expense.getParticipantSummaries.invalidate(group.id),
    ]);

    navigate(`/groups/${group.id}`);
  };

  return (
    <Stack spacing={3}>
      {createSettlement.error && (
        <Alert severity="error">{createSettlement.error.message}</Alert>
      )}

      <ParticipantSelect
        group={group}
        label="From"
        selectedId={fromId}
        setSelectedId={setFromId}
      />

      <ParticipantSelect
        group={group}
        label="To"
        selectedId={toId}
        setSelectedId={setToId}
        filterId={(id) => id !== fromId}
      />

      <MoneyField
        label="How much was given"
        fullWidth
        currencyCode={group.currencyCode}
        amount={amount}
        setAmount={setAmount}
      />

      <LoadingButton
        disabled={!valid}
        variant="contained"
        loading={createSettlement.isLoading}
        onClick={handleCreateSettlement}
      >
        Log Settlement
      </LoadingButton>
    </Stack>
  );
};

const ZExpenseType = z.enum(['expense', 'settlement']);

export const EditExpenseForm = ({
  group,
  me,
}: {
  group: GroupByIdResponse;
  me: User;
}) => {
  const [type, setType] = useState<z.infer<typeof ZExpenseType>>('expense');

  return (
    <Stack spacing={3}>
      <ToggleButtonGroup
        color="primary"
        value={type}
        exclusive
        onChange={(_e, value) => {
          setType(ZExpenseType.parse(value));
        }}
        fullWidth
      >
        <ToggleButton value="expense">Expense</ToggleButton>
        <ToggleButton value="settlement">Settlement</ToggleButton>
      </ToggleButtonGroup>

      {type === 'expense' && <RegularExpenseForm group={group} me={me} />}
      {type === 'settlement' && <SettlementForm group={group} me={me} />}
    </Stack>
  );
};
