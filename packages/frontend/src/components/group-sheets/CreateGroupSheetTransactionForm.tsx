import { Temporal } from '@js-temporal/polyfill';
import { type Dinero, allocate } from 'dinero.js';
import { produce } from 'immer';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
  useMemo,
} from 'react';
import {
  MdArrowCircleDown,
  MdArrowCircleUp,
  MdPayments,
  MdPlaylistAdd,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
  type Money,
  dineroToMoney,
  moneyToDinero,
  zeroMoney,
} from '@nihalgonsalves/expenses-shared/money';
import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionType } from '@nihalgonsalves/expenses-shared/types/transaction';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { CategoryId } from '../../data/categories';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import {
  convertCurrency,
  formatCurrency,
  formatDecimalCurrency,
  toDinero,
  useMoneyValues,
} from '../../utils/money';
import {
  clsxtw,
  dateTimeLocalToZonedISOString,
  nowForDateTimeInput,
} from '../../utils/utils';
import { Avatar } from '../Avatar';
import { Button } from '../form/Button';
import { CategorySelect } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { MoneyField } from '../form/MoneyField';
import { Select } from '../form/Select';
import { TextField } from '../form/TextField';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';

import { ParticipantListItem } from './ParticipantListItem';

type GroupTransactionShare = {
  participantId: string;
  participantName: string;
  share: Money;
};

enum GroupTransactionSplitType {
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
): GroupTransactionShare[] => {
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

type SplitConfig = (
  | {
      hasInput: true;
      inputMode: 'decimal' | 'numeric';
      unit: [singular: string, plural: string];
      ariaInputLabel: string;
    }
  | { hasInput: false }
) &
  (
    | {
        expectedSum: (amount: number) => number;
        formatErrorTooHigh: (diff: number, currencyCode: string) => string;
        formatErrorTooLow: (diff: number, currencyCode: string) => string;
      }
    | { expectedSum: undefined }
  );

const SPLIT_OPTIONS: { value: GroupTransactionSplitType; label: string }[] = [
  { value: GroupTransactionSplitType.Evenly, label: 'Evenly' },

  { value: GroupTransactionSplitType.Selected, label: 'Select participants' },

  { value: GroupTransactionSplitType.Shares, label: 'Shares' },

  { value: GroupTransactionSplitType.Percentage, label: 'Percentage' },

  { value: GroupTransactionSplitType.Amounts, label: 'Enter amounts' },
];

const SPLIT_CONFIG: Record<GroupTransactionSplitType, SplitConfig> = {
  [GroupTransactionSplitType.Evenly]: {
    expectedSum: undefined,
    hasInput: false,
  },
  [GroupTransactionSplitType.Selected]: {
    expectedSum: undefined,
    hasInput: false,
  },
  [GroupTransactionSplitType.Shares]: {
    expectedSum: undefined,
    hasInput: true,
    inputMode: 'numeric',
    unit: ['share', 'shares'],
    ariaInputLabel: 'Ratio',
  },
  [GroupTransactionSplitType.Percentage]: {
    expectedSum: () => 100,
    formatErrorTooHigh: (diff: number) =>
      `The percentages must add up to 100%. You need to add ${diff} percent.`,
    formatErrorTooLow: (diff: number) =>
      `The percentages must add up to 100%. You need to remove ${diff} percent.`,
    hasInput: true,
    inputMode: 'decimal',
    unit: ['%', '%'],
    ariaInputLabel: 'Percentage',
  },
  [GroupTransactionSplitType.Amounts]: {
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
    hasInput: false,
  },
};

const sumValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((sum, ratio) => sum + ratio, 0);

const validateSplit = (
  splitType: GroupTransactionSplitType,
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
    <div
      className={clsxtw('alert', 'mt-4', 'text-sm', {
        'alert-success': diff === 0,
        'alert-error': diff !== 0,
      })}
    >
      {diff === 0 && 'Splits are valid'}
      {diff < 0 && splitConfig.formatErrorTooLow(Math.abs(diff), currencyCode)}
      {diff > 0 && splitConfig.formatErrorTooHigh(Math.abs(diff), currencyCode)}
    </div>
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
  splits: GroupTransactionShare[];
  splitType: GroupTransactionSplitType;
  setSplitType: (val: GroupTransactionSplitType) => void;
  ratios: Record<string, number>;
  setRatios: Dispatch<SetStateAction<Record<string, number>>>;
  rate: { amount: number; scale: number } | undefined;
}) => {
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
    (value: GroupTransactionSplitType) => {
      const newType = z.nativeEnum(GroupTransactionSplitType).parse(value);

      switch (newType) {
        case GroupTransactionSplitType.Evenly:
        case GroupTransactionSplitType.Shares:
        case GroupTransactionSplitType.Selected:
          setRatios(getDefaultRatios(groupSheet));
          break;

        case GroupTransactionSplitType.Percentage:
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

        case GroupTransactionSplitType.Amounts:
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
      <ToggleButtonGroup<GroupTransactionSplitType>
        className="join-vertical w-full md:join-horizontal"
        value={splitType}
        setValue={handleChangeSplitType}
        options={SPLIT_OPTIONS}
      />

      <CalculationHelpText
        splitConfig={splitConfig}
        ratios={ratios}
        amount={amount}
        currencyCode={currencyCode}
      />

      <ul className="grid gap-2" style={{ paddingBlock: '1rem' }}>
        {splits.map(({ participantId, participantName, share }) => (
          <ParticipantListItem
            key={participantId}
            avatar={<Avatar name={participantName} />}
          >
            <div className="flex flex-grow items-center justify-between">
              <div className="flex-grow">
                {participantName}
                <br />
                <span className="text-gray-500">
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
                </span>
              </div>
              {splitConfig.hasInput && (
                <div className="flex items-center gap-4">
                  <TextField
                    inputClassName="w-24"
                    inputMode={splitConfig.inputMode}
                    maxLength={4}
                    label={null}
                    aria-label={`${splitConfig.ariaInputLabel} for ${participantName}`}
                    value={`${ratios[participantId]}`}
                    setValue={(val) => {
                      handleChangeRatio(participantId, val);
                    }}
                  />
                  <div>
                    {ratios[participantId] === 1
                      ? splitConfig.unit[0]
                      : splitConfig.unit[1]}
                  </div>
                </div>
              )}
              {splitType === GroupTransactionSplitType.Amounts && (
                <MoneyField
                  inputClassName="w-full"
                  currencyCode={currencyCode}
                  amount={ratios[participantId] ?? 0}
                  setAmount={(val) => {
                    handleChangeRatio(participantId, val);
                  }}
                  label={null}
                  aria-label={`Amount for ${participantName}`}
                />
              )}
              {splitType === GroupTransactionSplitType.Selected && (
                <input
                  type="checkbox"
                  className="checkbox"
                  aria-label={`Include ${participantName}`}
                  checked={ratios[participantId] === 1}
                  onChange={(e) => {
                    handleChangeRatio(participantId, e.target.checked ? 1 : 0);
                  }}
                />
              )}
            </div>
          </ParticipantListItem>
        ))}
      </ul>
    </>
  );
};

const ParticipantSelect = ({
  groupSheet,
  label,
  selectedId,
  setSelectedId,
}: {
  groupSheet: GroupSheetByIdResponse;
  label: string;
  selectedId: string | undefined;
  setSelectedId: (val: string) => void;
}) => {
  const options = Object.values(groupSheet.participants);

  return (
    <Select
      label={label}
      value={selectedId ?? ''}
      setValue={setSelectedId}
      schema={z.string()}
      options={[
        { label: 'Please Select...', value: '', disabled: true },
        ...options.map(({ id, name }) => ({ value: id, label: name })),
      ]}
    />
  );
};

const TransactionForm = ({
  groupSheet,
  me,
  type,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
  type: Exclude<TransactionType, 'TRANSFER'>;
}) => {
  const utils = trpc.useContext();
  const { mutateAsync: createGroupSheetTransaction, isLoading } =
    trpc.transaction.createGroupSheetTransaction.useMutation();

  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const [paidOrReceivedById, setPaidOrReceivedById] = useState(me.id);
  const [currencyCode, setCurrencyCode] = useState(groupSheet.currencyCode);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<CategoryId>();
  const [description, setDescription] = useState('');
  const [spentAt, setSpentAt] = useState(nowForDateTimeInput());

  const [dineroValue, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const [splitType, setSplitType] = useState<GroupTransactionSplitType>(
    GroupTransactionSplitType.Evenly,
  );
  const [ratios, setRatios] = useState(getDefaultRatios(groupSheet));
  const splits = calcSplits(groupSheet, currencyCode, dineroValue, ratios);

  const {
    supportedCurrencies,
    rate,
    targetSnapshot: convertedMoneySnapshot,
  } = useCurrencyConversion(
    Temporal.PlainDate.from(spentAt),
    currencyCode,
    groupSheet.currencyCode,
    moneySnapshot,
  );

  const valid =
    moneySnapshot.amount > 0 && validateSplit(splitType, ratios, amount);
  const disabled = !valid || !onLine;

  const handleCreateTransaction = async () => {
    if (disabled) {
      return;
    }

    const basePayload = {
      type,
      groupSheetId: groupSheet.id,
      paidOrReceivedById,
      description,
      category: category ?? CategoryId.Other,
      spentAt: dateTimeLocalToZonedISOString(spentAt),
    };

    if (groupSheet.currencyCode === currencyCode) {
      await createGroupSheetTransaction({
        ...basePayload,
        money: moneySnapshot,
        splits,
      });
    } else if (convertedMoneySnapshot) {
      await createGroupSheetTransaction({
        ...basePayload,
        money: convertedMoneySnapshot,
        splits: calcSplits(
          groupSheet,
          currencyCode,
          moneyToDinero(convertedMoneySnapshot),
          ratios,
        ),
      });
    }

    navigate(`/groups/${groupSheet.id}`);

    await Promise.all([
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getGroupSheetTransactions.invalidate({
        groupSheetId: groupSheet.id,
      }),
      utils.transaction.getParticipantSummaries.invalidate(groupSheet.id),
    ]);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid || !onLine) {
          return;
        }

        void handleCreateTransaction();
      }}
    >
      <div className="flex gap-4">
        <MoneyField
          className="flex-grow"
          autoFocus
          label={
            type === 'EXPENSE'
              ? 'How much was spent?'
              : 'How much was received?'
          }
          bottomLabel={
            convertedMoneySnapshot
              ? formatCurrency(convertedMoneySnapshot)
              : null
          }
          currencyCode={currencyCode}
          amount={amount}
          setAmount={setAmount}
        />

        {supportedCurrencies.includes(groupSheet.currencyCode) && (
          <CurrencySelect
            options={supportedCurrencies}
            currencyCode={currencyCode}
            setCurrencyCode={setCurrencyCode}
          />
        )}
      </div>

      <ParticipantSelect
        groupSheet={groupSheet}
        label={type === 'EXPENSE' ? 'Who paid?' : 'Who received money?'}
        selectedId={paidOrReceivedById}
        setSelectedId={(newId) => {
          if (!newId) return;

          setPaidOrReceivedById(newId);
        }}
      />

      <CategorySelect category={category} setCategory={setCategory} />

      <TextField
        label="Description"
        value={description}
        setValue={setDescription}
      />

      <TextField
        label="When?"
        type="datetime-local"
        inputClassName="appearance-none"
        value={spentAt}
        setValue={setSpentAt}
      />

      <div className="divider" />

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

      <Button
        className="btn-primary btn-block"
        isLoading={isLoading}
        type="submit"
        disabled={disabled}
      >
        <MdPlaylistAdd /> Add {type === 'EXPENSE' ? 'Expense' : 'Income'}
      </Button>
    </form>
  );
};

const SettlementForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [fromId, setFromId] = useState<string | undefined>(me.id);
  const [toId, setToId] = useState<string | undefined>();

  const [, moneySnapshot] = useMoneyValues(amount, groupSheet.currencyCode);

  const utils = trpc.useContext();
  const { mutateAsync: createGroupSheetSettlement, isLoading } =
    trpc.transaction.createGroupSheetSettlement.useMutation();

  const valid =
    fromId != null &&
    fromId !== '' &&
    toId != null &&
    toId !== '' &&
    fromId !== toId &&
    amount > 0;

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
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getGroupSheetTransactions.invalidate({
        groupSheetId: groupSheet.id,
      }),
      utils.transaction.getParticipantSummaries.invalidate(groupSheet.id),
    ]);

    navigate(`/groups/${groupSheet.id}`, { replace: true });
  };

  const disabled = !valid || !onLine;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;

        void handleCreateSettlement();
      }}
    >
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
      />

      <MoneyField
        autoFocus
        label="How much was given"
        currencyCode={groupSheet.currencyCode}
        amount={amount}
        setAmount={setAmount}
      />

      <Button
        className="btn-primary btn-block mt-4"
        type="submit"
        disabled={disabled}
        isLoading={isLoading}
      >
        Log Settlement
      </Button>
    </form>
  );
};

const TYPE_OPTIONS = [
  {
    value: 'EXPENSE',
    label: (
      <>
        <span className="text-xl">
          <MdArrowCircleUp />
        </span>{' '}
        Expense
      </>
    ),
  },
  {
    value: 'INCOME',
    label: (
      <>
        <span className="text-xl">
          <MdArrowCircleDown />
        </span>{' '}
        Income
      </>
    ),
  },
  {
    value: 'TRANSFER',
    label: (
      <>
        <span className="text-xl">
          <MdPayments />
        </span>
        Settlement
      </>
    ),
  },
] as const;

export const CreateGroupSheetTransactionForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');

  return (
    <div className="flex flex-col gap-4">
      <ToggleButtonGroup
        className="w-full join-vertical sm:join-horizontal"
        value={type}
        setValue={setType}
        options={TYPE_OPTIONS}
      />
      {type === 'TRANSFER' ? (
        <SettlementForm groupSheet={groupSheet} me={me} />
      ) : (
        <TransactionForm type={type} groupSheet={groupSheet} me={me} />
      )}
    </div>
  );
};
