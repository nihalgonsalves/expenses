import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type Sheet } from '@nihalgonsalves/expenses-backend';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { CategoryId } from '../../data/categories';
import { formatCurrency, useMoneyValues } from '../../utils/money';
import {
  dateTimeLocalToISOString,
  nowForDateTimeInput,
} from '../../utils/utils';
import { CategorySelect } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { LoadingButton } from '../form/LoadingButton';
import { MoneyField } from '../form/MoneyField';
import { TextField } from '../form/TextField';

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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;

        void handleCreateExpense();
      }}
    >
      {error && <div className="alert alert-error">{error.message}</div>}

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
        value={spentAt}
        setValue={setSpentAt}
      />

      <LoadingButton
        className="btn-block mt-4"
        type="submit"
        disabled={!valid}
        isLoading={isLoading}
      >
        Create
      </LoadingButton>
    </form>
  );
};
