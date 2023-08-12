import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';
import { MdArrowCircleDown, MdArrowCircleUp } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionType } from '@nihalgonsalves/expenses-shared/types/transaction';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { CategoryId } from '../../data/categories';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency, useMoneyValues } from '../../utils/money';
import {
  dateTimeLocalToISOString,
  nowForDateTimeInput,
} from '../../utils/utils';
import { Button } from '../form/Button';
import { CategorySelect } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { MoneyField } from '../form/MoneyField';
import { TextField } from '../form/TextField';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';

const TYPE_OPTIONS = [
  {
    value: 'EXPENSE',
    label: (
      <>
        <span className="text-xl">
          <MdArrowCircleUp />
        </span>
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
] as const;

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
  const [category, setCategory] = useState<CategoryId>();
  const [description, setDescription] = useState('');
  const [spentAt, setSpentAt] = useState(nowForDateTimeInput());

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      Temporal.PlainDate.from(spentAt),
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const utils = trpc.useContext();
  const { mutateAsync: createPersonalSheetTransaction, isLoading } =
    trpc.transaction.createPersonalSheetTransaction.useMutation();

  const valid = amount > 0;

  const handleCreateTransaction = async () => {
    const money = convertedMoneySnapshot ?? moneySnapshot;
    await createPersonalSheetTransaction({
      type,
      personalSheetId: personalSheet.id,
      money,
      category: category ?? CategoryId.Other,
      description,
      spentAt: dateTimeLocalToISOString(spentAt),
    });

    navigate(`/sheets/${personalSheet.id}/expenses`, { replace: true });

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
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;

        void handleCreateTransaction();
      }}
    >
      <ToggleButtonGroup
        className="w-full"
        options={TYPE_OPTIONS}
        value={type}
        setValue={setType}
      />

      <div className="flex items-start gap-4">
        <MoneyField
          className="flex-grow"
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

        {supportedCurrencies.includes(personalSheet.currencyCode) && (
          <CurrencySelect
            options={supportedCurrencies}
            currencyCode={currencyCode}
            setCurrencyCode={setCurrencyCode}
          />
        )}
      </div>

      <CategorySelect category={category} setCategory={setCategory} />

      <TextField
        label="Description"
        value={description}
        setValue={setDescription}
      />

      <TextField
        label="Date & Time"
        type="datetime-local"
        inputClassName="appearance-none"
        value={spentAt}
        setValue={setSpentAt}
      />

      <Button
        className="btn-primary btn-block mt-4"
        type="submit"
        disabled={disabled}
        isLoading={isLoading}
      >
        Create
      </Button>
    </form>
  );
};
