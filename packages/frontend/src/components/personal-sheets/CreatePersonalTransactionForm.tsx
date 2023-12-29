import { Temporal } from '@js-temporal/polyfill';
import { ThickArrowDownIcon, ThickArrowUpIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import {
  ZRecurrenceFrequency,
  type TransactionType,
} from '@nihalgonsalves/expenses-shared/types/transaction';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency, useMoneyValues } from '../../utils/money';
import {
  dateTimeLocalToZonedISOString,
  nowForDateTimeInput,
} from '../../utils/utils';
import { CategorySelect, OTHER_CATEGORY } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { MoneyField } from '../form/MoneyField';
import { Select, type SelectOption } from '../form/Select';
import { TextField } from '../form/TextField';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

const TYPE_OPTIONS = [
  {
    value: 'EXPENSE',
    label: (
      <>
        <ThickArrowUpIcon className="mr-2 text-xl" />
        Expense
      </>
    ),
  },
  {
    value: 'INCOME',
    label: (
      <>
        <ThickArrowDownIcon className="mr-2 text-xl" />
        Income
      </>
    ),
  },
] as const;

const ZRecurrence = z.union([z.literal('NO_RRULE'), ZRecurrenceFrequency]);

const RECURRENCE_OPTIONS = [
  {
    value: 'NO_RRULE',
    label: 'No',
  },
  {
    value: 'MONTHLY',
    label: 'Every month',
  },
  {
    value: 'WEEKLY',
    label: 'Every week',
  },
] satisfies SelectOption<typeof ZRecurrence>[];

export const CreatePersonalTransactionForm = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const [type, setType] =
    useState<Exclude<TransactionType, 'TRANSFER'>>('EXPENSE');

  const [amount, setAmount] = useState(0);
  const [currencyCode, setCurrencyCode] = useState(personalSheet.currencyCode);
  const [category, setCategory] = useState<string>();
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(nowForDateTimeInput());

  const [recurrence, setRecurrence] =
    useState<(typeof RECURRENCE_OPTIONS)[number]['value']>('NO_RRULE');

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      Temporal.PlainDate.from(dateTime),
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const utils = trpc.useUtils();
  const {
    mutateAsync: createPersonalSheetTransaction,
    isLoading: noScheduleMutationIsLoading,
  } = trpc.transaction.createPersonalSheetTransaction.useMutation();

  const {
    mutateAsync: createPersonalSheetTransactionSchedule,
    isLoading: scheduleMutationIsLoading,
  } = trpc.transaction.createPersonalSheetTransactionSchedule.useMutation();

  const isLoading = noScheduleMutationIsLoading || scheduleMutationIsLoading;

  const valid = amount > 0;

  const handleCreateTransaction = async () => {
    const money = convertedMoneySnapshot ?? moneySnapshot;

    if (recurrence == 'NO_RRULE') {
      await createPersonalSheetTransaction({
        type,
        personalSheetId: personalSheet.id,
        money,
        category: category ?? OTHER_CATEGORY,
        description,
        spentAt: dateTimeLocalToZonedISOString(dateTime),
      });
      navigate(`/sheets/${personalSheet.id}/transactions`, { replace: true });
    } else {
      await createPersonalSheetTransactionSchedule({
        type,
        personalSheetId: personalSheet.id,
        money,
        category: category ?? OTHER_CATEGORY,
        description,
        firstOccurrenceAt: dateTimeLocalToZonedISOString(dateTime),
        recurrenceRule: {
          freq: recurrence,
        },
      });
      navigate(`/sheets/${personalSheet.id}`, { replace: true });
    }

    await Promise.all([
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getPersonalSheetTransactions.invalidate({
        personalSheetId: personalSheet.id,
      }),
    ]);
  };

  const disabled = !valid || !onLine;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;

        void handleCreateTransaction();
      }}
    >
      <ToggleButtonGroup
        className="[&>button]:grow"
        options={TYPE_OPTIONS}
        value={type}
        setValue={setType}
      />

      <Separator className="my-2" />

      <div className="flex gap-4">
        <div className="grow">
          <MoneyField
            className="grow"
            autoFocus
            label="Amount"
            bottomLabel={
              convertedMoneySnapshot
                ? formatCurrency(convertedMoneySnapshot)
                : null
            }
            currencyCode={currencyCode}
            amount={amount}
            setAmount={setAmount}
          />
        </div>

        <Label className="mt-0.5 flex flex-col justify-start gap-2">
          Currency
          {supportedCurrencies.includes(personalSheet.currencyCode) && (
            <CurrencySelect
              options={supportedCurrencies}
              currencyCode={currencyCode}
              setCurrencyCode={setCurrencyCode}
            />
          )}
        </Label>
      </div>

      <Label className="flex flex-col gap-2">
        Category
        <CategorySelect categoryId={category} setCategoryId={setCategory} />
      </Label>

      <div className="flex flex-col gap-2">
        <TextField
          label="Description"
          value={description}
          setValue={setDescription}
        />
      </div>

      <div className="flex flex-col gap-2">
        <TextField
          label={
            recurrence === 'NO_RRULE' ? 'Date & Time' : 'Starting Date & Time'
          }
          type="datetime-local"
          inputClassName="appearance-none"
          value={dateTime}
          setValue={setDateTime}
        />
      </div>

      <Label className="flex flex-col gap-2">
        Recurring?
        <Select
          placeholder="Recurring?"
          options={RECURRENCE_OPTIONS}
          value={recurrence}
          setValue={setRecurrence}
          schema={ZRecurrence}
        />
      </Label>

      <Button
        className="mt-4"
        type="submit"
        disabled={disabled}
        isLoading={isLoading}
      >
        Create
      </Button>
    </form>
  );
};
