import { zodResolver } from '@hookform/resolvers/zod';
import { Temporal } from '@js-temporal/polyfill';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import {
  ZUpdatePersonalSheetTransactionInput,
  type TransactionListItem,
} from '@nihalgonsalves/expenses-shared/types/transaction';

import { useCurrencyConversion } from '../../api/currencyConversion';
import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency, useMoneyValues } from '../../utils/money';
import {
  dateTimeLocalToZonedISOString,
  isoToTemporalZonedDateTime,
} from '../../utils/temporal';
import { CategorySelect } from '../form/CategorySelect';
import { CurrencySelect } from '../form/CurrencySelect';
import { MoneyField } from '../form/MoneyField';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

const formSchema = ZUpdatePersonalSheetTransactionInput.omit({
  id: true,
  type: true,
  personalSheetId: true,
  money: true,
}).extend({
  currencyCode: z.string().min(1),
  amount: z.number().positive({ message: 'Amount is required' }),
});

export const EditPersonalTransactionForm = ({
  transaction,
  personalSheet,
}: {
  transaction: TransactionListItem;
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      currencyCode: personalSheet.currencyCode,
      category: transaction.category,
      amount: Math.abs(transaction.money.amount),
      description: transaction.description,
      spentAt: isoToTemporalZonedDateTime(transaction.spentAt)
        .toPlainDateTime()
        .toString(),
    },
  });
  const amount = useWatch({ name: 'amount', control: form.control });
  const currencyCode = useWatch({
    name: 'currencyCode',
    control: form.control,
  });
  const spentAt = useWatch({ name: 'spentAt', control: form.control });

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      Temporal.PlainDate.from(spentAt),
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const utils = trpc.useUtils();
  const { mutateAsync: updatePersonalSheetTransaction, isLoading } =
    trpc.transaction.updatePersonalSheetTransaction.useMutation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const money = convertedMoneySnapshot ?? moneySnapshot;

    await updatePersonalSheetTransaction({
      id: transaction.id,
      // this should not be required, but the returned type has an extraneous 'TRANFER' value
      type: z.enum(['EXPENSE', 'INCOME']).parse(transaction.type),
      personalSheetId: personalSheet.id,
      money,
      category: values.category,
      description: values.description,
      spentAt: dateTimeLocalToZonedISOString(values.spentAt),
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

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-4">
          <div className="grow">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <MoneyField
                      className="grow"
                      autoFocus
                      currencyCode={currencyCode}
                      {...field}
                    />
                  </FormControl>

                  {convertedMoneySnapshot && (
                    <FormDescription>
                      {formatCurrency(convertedMoneySnapshot)}
                    </FormDescription>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  {supportedCurrencies.includes(personalSheet.currencyCode) && (
                    <CurrencySelect options={supportedCurrencies} {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelect
                  className="w-full"
                  placeholder="Select a category"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spentAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="appearance-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="w-full"
          type="submit"
          disabled={disabled}
          isLoading={isLoading}
        >
          Update
        </Button>
      </form>
    </Form>
  );
};
