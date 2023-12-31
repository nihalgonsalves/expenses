import { zodResolver } from '@hookform/resolvers/zod';
import { Temporal } from '@js-temporal/polyfill';
import { ThickArrowDownIcon, ThickArrowUpIcon } from '@radix-ui/react-icons';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import {
  ZRecurrenceFrequency,
  ZCreatePersonalSheetTransactionScheduleInput,
  ZCreatePersonalSheetTransactionInput,
  ZRecurrenceRule,
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
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';
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

const RECURRENCE_OPTIONS = [
  {
    value: undefined,
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
] satisfies SelectOption<typeof ZRecurrenceFrequency>[];

const formSchema = ZCreatePersonalSheetTransactionInput.merge(
  ZCreatePersonalSheetTransactionScheduleInput,
)
  .omit({
    money: true,
    personalSheetId: true,
    // replace these differing parameters with `dateTime`
    spentAt: true,
    firstOccurrenceAt: true,
  })
  .extend({
    recurrenceRule: ZRecurrenceRule.partial().optional(),
    currencyCode: z.string().min(1),
    amount: z.number().positive({ message: 'Amount is required' }),
    dateTime: z.string().min(1),
  });

export const CreatePersonalTransactionForm = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      type: 'EXPENSE',
      currencyCode: personalSheet.currencyCode,
      category: OTHER_CATEGORY,
      amount: 0,
      description: '',
      dateTime: nowForDateTimeInput(),
    },
  });

  const amount = useWatch({ name: 'amount', control: form.control });
  const currencyCode = useWatch({
    name: 'currencyCode',
    control: form.control,
  });
  const dateTime = useWatch({ name: 'dateTime', control: form.control });
  const recurrenceRule = useWatch({
    name: 'recurrenceRule',
    control: form.control,
  });

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const commonValues = {
      type: values.type,
      personalSheetId: personalSheet.id,
      money: convertedMoneySnapshot ?? moneySnapshot,
      category: values.category,
      description: values.description,
    };

    if (values.recurrenceRule?.freq) {
      await createPersonalSheetTransactionSchedule({
        ...commonValues,
        firstOccurrenceAt: dateTimeLocalToZonedISOString(dateTime),
        recurrenceRule: {
          freq: values.recurrenceRule.freq,
        },
      });
      navigate(`/sheets/${personalSheet.id}`, { replace: true });
    } else {
      await createPersonalSheetTransaction({
        ...commonValues,
        spentAt: dateTimeLocalToZonedISOString(dateTime),
      });
      navigate(`/sheets/${personalSheet.id}/transactions`, { replace: true });
    }

    await Promise.all([
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getPersonalSheetTransactions.invalidate({
        personalSheetId: personalSheet.id,
      }),
    ]);
  };

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormControl>
                <ToggleButtonGroup
                  className="grid grid-cols-2"
                  options={TYPE_OPTIONS}
                  value={field.value}
                  setValue={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-2" />

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
          name="dateTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {recurrenceRule?.freq ? 'Starting Date & Time' : 'Date & Time'}
              </FormLabel>
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

        <FormField
          control={form.control}
          name="recurrenceRule.freq"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurring?</FormLabel>
              <FormControl>
                <Select
                  placeholder="Recurring?"
                  options={RECURRENCE_OPTIONS}
                  value={field.value}
                  setValue={field.onChange}
                  schema={ZRecurrenceFrequency}
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
          Create
        </Button>
      </form>
    </Form>
  );
};
