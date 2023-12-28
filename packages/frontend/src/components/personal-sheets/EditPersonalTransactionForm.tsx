import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionListItem } from '@nihalgonsalves/expenses-shared/types/transaction';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency, useMoneyValues } from '../../utils/money';
import {
  dateTimeLocalToZonedISOString,
  isoToTemporalZonedDateTime,
} from '../../utils/utils';
import { Button } from '../form/Button';
import { CategorySelect, OTHER_CATEGORY } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { MoneyField } from '../form/MoneyField';
import { TextField } from '../form/TextField';
import { Label } from '../ui/label';

export const EditPersonalTransactionForm = ({
  transaction,
  personalSheet,
}: {
  transaction: TransactionListItem;
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const [amount, setAmount] = useState(Math.abs(transaction.money.amount));
  const [currencyCode, setCurrencyCode] = useState(personalSheet.currencyCode);
  const [category, setCategory] = useState<string | undefined>(
    transaction.category,
  );
  const [description, setDescription] = useState(transaction.description);
  const [dateTime, setDateTime] = useState(
    isoToTemporalZonedDateTime(transaction.spentAt)
      .toPlainDateTime()
      .toString(),
  );

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      Temporal.PlainDate.from(dateTime),
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const utils = trpc.useUtils();
  const { mutateAsync: updatePersonalSheetTransaction, isLoading } =
    trpc.transaction.updatePersonalSheetTransaction.useMutation();

  const valid = amount > 0;

  const handleCreateTransaction = async () => {
    const money = convertedMoneySnapshot ?? moneySnapshot;

    await updatePersonalSheetTransaction({
      id: transaction.id,
      // this should not be required, but the returned type has an extraneous 'TRANFER' value
      type: z.enum(['EXPENSE', 'INCOME']).parse(transaction.type),
      personalSheetId: personalSheet.id,
      money,
      category: category ?? OTHER_CATEGORY,
      description,
      spentAt: dateTimeLocalToZonedISOString(dateTime),
    });
    navigate(`/sheets/${personalSheet.id}/transactions`, { replace: true });

    await Promise.all([
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getPersonalSheetTransactions.invalidate({
        personalSheetId: personalSheet.id,
      }),
      utils.transaction.getTransaction.invalidate({
        transactionId: transaction.id,
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
      <div className="flex items-start gap-4">
        <div className="flex grow flex-col gap-2">
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

        <Label className="mt-0.5 flex flex-col gap-2">
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
          label="Date & Time"
          type="datetime-local"
          inputClassName="appearance-none"
          value={dateTime}
          setValue={setDateTime}
        />
      </div>

      <Button type="submit" disabled={disabled} isLoading={isLoading}>
        Update
      </Button>
    </form>
  );
};
