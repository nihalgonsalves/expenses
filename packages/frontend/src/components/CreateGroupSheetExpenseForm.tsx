import { PlaylistAdd } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  List,
  Typography,
  ListItem,
  Alert,
  Checkbox,
} from '@mui/material';
import { type Dinero, allocate } from 'dinero.js';
import { produce } from 'immer';
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
  type User,
  type Money,
  type GroupSheetByIdResponse,
  dineroToMoney,
  moneyToDinero,
  zeroMoney,
} from '@nihalgonsalves/expenses-backend';

import { useCurrencyConversion } from '../api/currencyConversion';
import { trpc } from '../api/trpc';
import { CategoryId } from '../data/categories';
import { useToggleButtonOrientation } from '../utils/hooks';
import {
  convertCurrency,
  formatCurrency,
  formatDecimalCurrency,
  toDinero,
  useMoneyValues,
} from '../utils/money';
import {
  dateTimeLocalToISOString,
  getInitials,
  nowForDateTimeInput,
} from '../utils/utils';

import { CategorySelect } from './CategorySelect';
import { CurrencySelect } from './CurrencySelect';
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
  groupSheet: GroupSheetByIdResponse,
  currencyCode: string,
  money: Dinero<number>,
  ratios: Record<string, number>,
): SplitGroupExpenseSplit[] => {
  const indexedRatios = groupSheet.participants.map(
    ({ id }) => ratios[id] ?? 0,
  );

  const allocations = indexedRatios.some((ratio) => ratio !== 0)
    ? allocate(money, indexedRatios)
    : [];

  return groupSheet.participants.map(({ id, name }, i) => {
    const alloc = allocations[i];

    return {
      participantId: id,
      participantName: name,
      share: alloc ? dineroToMoney(alloc) : zeroMoney(currencyCode),
    };
  });
};

const getDefaultRatios = (groupSheet: GroupSheetByIdResponse) =>
  Object.fromEntries(groupSheet.participants.map(({ id }) => [id, 1]));

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
  groupSheet,
  amount,
  currencyCode,
  splits,
  splitType,
  setSplitType,
  ratios,
  setRatios,
  rate,
}: {
  groupSheet: GroupSheetByIdResponse;
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
      setRatios(
        produce((prev) => {
          if (ratio === '') {
            prev[participantId] = 0;
          }

          const ratioInt =
            typeof ratio === 'string' ? parseInt(ratio, 10) : ratio;

          if (!Number.isNaN(ratioInt)) {
            prev[participantId] = ratioInt;
          }
        }),
      );
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
          setRatios(getDefaultRatios(groupSheet));
          break;

        case SplitGroupExpenseSplitType.Percentage:
          setRatios(
            100 % groupSheet.participants.length === 0
              ? Object.fromEntries(
                  groupSheet.participants.map(({ id }) => [
                    id,
                    100 / groupSheet.participants.length,
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
                    groupSheet,
                    currencyCode,
                    money,
                    getDefaultRatios(groupSheet),
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
    [
      splitValid,
      splits,
      groupSheet,
      currencyCode,
      money,
      setRatios,
      setSplitType,
    ],
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
                      {groupSheet.currencyCode !== currencyCode &&
                        rate &&
                        ` (${formatCurrency(
                          convertCurrency(share, groupSheet.currencyCode, rate),
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
  groupSheet,
  label,
  selectedId,
  setSelectedId,
  filterId,
}: {
  groupSheet: GroupSheetByIdResponse;
  label: string;
  selectedId: string | undefined;
  setSelectedId: (val: string) => void;
  filterId?: (val: string) => boolean;
}) => {
  const selectId = useId();

  const options = filterId
    ? Object.values(groupSheet.participants).filter(({ id }) => filterId(id))
    : Object.values(groupSheet.participants);

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
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const {
    mutateAsync: createGroupSheetExpense,
    isLoading,
    error,
  } = trpc.expense.createGroupSheetExpense.useMutation();

  const navigate = useNavigate();

  const [paidById, setPaidById] = useState(me.id);
  const [currencyCode, setCurrencyCode] = useState(groupSheet.currencyCode);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<CategoryId>();
  const [description, setDescription] = useState('');
  const [spentAt, setSpentAt] = useState(nowForDateTimeInput());

  const [dineroValue, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const [splitType, setSplitType] = useState<SplitGroupExpenseSplitType>(
    SplitGroupExpenseSplitType.Evenly,
  );
  const [ratios, setRatios] = useState(getDefaultRatios(groupSheet));
  const splits = calcSplits(groupSheet, currencyCode, dineroValue, ratios);

  const {
    supportedCurrencies,
    rate,
    targetSnapshot: convertedMoneySnapshot,
  } = useCurrencyConversion(
    currencyCode,
    groupSheet.currencyCode,
    moneySnapshot,
  );

  const valid =
    moneySnapshot.amount > 0 && validateSplit(splitType, ratios, amount);

  const handleCreateExpense = async () => {
    if (!valid) {
      return;
    }

    if (groupSheet.currencyCode === currencyCode) {
      await createGroupSheetExpense({
        groupSheetId: groupSheet.id,
        paidById,
        description,
        category: category ?? CategoryId.Other,
        money: moneySnapshot,
        spentAt: dateTimeLocalToISOString(spentAt),
        splits,
      });
    } else if (convertedMoneySnapshot) {
      await createGroupSheetExpense({
        groupSheetId: groupSheet.id,
        paidById,
        description,
        category: category ?? CategoryId.Other,
        money: convertedMoneySnapshot,
        spentAt: dateTimeLocalToISOString(spentAt),
        splits: calcSplits(
          groupSheet,
          currencyCode,
          moneyToDinero(convertedMoneySnapshot),
          ratios,
        ),
      });
    }

    navigate(`/groups/${groupSheet.id}`);
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
      {error && <Alert severity="error">{error.message}</Alert>}

      <Stack direction="row" spacing={1}>
        <MoneyField
          fullWidth
          autoFocus
          label="How much was spent?"
          currencyCode={currencyCode}
          amount={amount}
          setAmount={setAmount}
          helperText={
            convertedMoneySnapshot
              ? formatCurrency(convertedMoneySnapshot)
              : null
          }
        />

        {supportedCurrencies.includes(groupSheet.currencyCode) && (
          <CurrencySelect
            options={supportedCurrencies}
            currencyCode={currencyCode}
            setCurrencyCode={setCurrencyCode}
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        )}
      </Stack>

      <ParticipantSelect
        groupSheet={groupSheet}
        label="Who paid?"
        selectedId={paidById}
        setSelectedId={(newId) => {
          if (!newId) return;

          setPaidById(newId);
        }}
      />

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
        label="When?"
        type="datetime-local"
        value={spentAt}
        onChange={(e) => {
          setSpentAt(e.target.value);
        }}
      />

      <SplitsFormSection
        groupSheet={groupSheet}
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
        loading={isLoading}
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
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [fromId, setFromId] = useState<string | undefined>(me.id);
  const [toId, setToId] = useState<string | undefined>();

  const [, moneySnapshot] = useMoneyValues(amount, groupSheet.currencyCode);

  const utils = trpc.useContext();
  const {
    mutateAsync: createGroupSheetSettlement,
    isLoading,
    error,
  } = trpc.expense.createGroupSheetSettlement.useMutation();

  const valid = fromId && toId && fromId !== toId && amount > 0;

  const handleCreateSettlement = async () => {
    if (!fromId || !toId) {
      return;
    }

    await createGroupSheetSettlement({
      groupSheetId: groupSheet.id,
      fromId,
      toId,
      money: moneySnapshot,
    });

    await Promise.all([
      utils.expense.getGroupSheetExpenses.invalidate({
        groupSheetId: groupSheet.id,
      }),
      utils.expense.getParticipantSummaries.invalidate(groupSheet.id),
    ]);

    navigate(`/groups/${groupSheet.id}`);
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error.message}</Alert>}

      <ParticipantSelect
        groupSheet={groupSheet}
        label="From"
        selectedId={fromId}
        setSelectedId={setFromId}
      />

      <ParticipantSelect
        groupSheet={groupSheet}
        label="To"
        selectedId={toId}
        setSelectedId={setToId}
        filterId={(id) => id !== fromId}
      />

      <MoneyField
        label="How much was given"
        fullWidth
        currencyCode={groupSheet.currencyCode}
        amount={amount}
        setAmount={setAmount}
      />

      <LoadingButton
        disabled={!valid}
        variant="contained"
        loading={isLoading}
        onClick={handleCreateSettlement}
      >
        Log Settlement
      </LoadingButton>
    </Stack>
  );
};

const ZExpenseType = z.enum(['expense', 'settlement']);

export const CreateGroupSheetExpenseForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
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

      {type === 'expense' && (
        <RegularExpenseForm groupSheet={groupSheet} me={me} />
      )}
      {type === 'settlement' && (
        <SettlementForm groupSheet={groupSheet} me={me} />
      )}
    </Stack>
  );
};