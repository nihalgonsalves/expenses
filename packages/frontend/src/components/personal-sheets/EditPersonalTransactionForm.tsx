import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  ZUpdatePersonalSheetTransactionInput,
  type TransactionWithSheet,
} from "@nihalgonsalves/expenses-shared/types/transaction";

import { useCurrencyConversion } from "../../api/currencyConversion";
import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import {
  dateTimeLocalToZonedISOString,
  isoToTemporalZonedDateTime,
} from "../../utils/temporal";
import { useMoneyValues } from "../../utils/useMoneyValues";
import { CurrencySpan } from "../CurrencySpan";
import { CategorySelect } from "../form/CategorySelect";
import { CurrencySelect } from "../form/CurrencySelect";
import { MoneyField } from "../form/MoneyField";
import { ResponsiveDialog, useDialog } from "../form/ResponsiveDialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const formSchema = ZUpdatePersonalSheetTransactionInput.omit({
  id: true,
  type: true,
  personalSheetId: true,
  money: true,
}).extend({
  currencyCode: z.string().min(1),
  amount: z.number().positive({ message: "Amount is required" }),
});

const EditPersonalTransactionForm = ({
  data,
}: {
  data: TransactionWithSheet;
}) => {
  const { sheet: personalSheet, ...transaction } = data;

  const dialog = useDialog();

  const onLine = useNavigatorOnLine();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
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
  const amount = useWatch({ name: "amount", control: form.control });
  const currencyCode = useWatch({
    name: "currencyCode",
    control: form.control,
  });
  const spentAt = useWatch({ name: "spentAt", control: form.control });

  const [, moneySnapshot] = useMoneyValues(amount, currencyCode);

  const { supportedCurrencies, targetSnapshot: convertedMoneySnapshot } =
    useCurrencyConversion(
      Temporal.PlainDate.from(spentAt),
      currencyCode,
      personalSheet.currencyCode,
      moneySnapshot,
    );

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: updatePersonalSheetTransaction, isPending } =
    useMutation(
      trpc.transaction.updatePersonalSheetTransaction.mutationOptions(),
    );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const money = convertedMoneySnapshot ?? moneySnapshot;

    await updatePersonalSheetTransaction({
      id: transaction.id,
      // this should not be required, but the returned type has an extraneous 'TRANSFER' value
      type: z.enum(["EXPENSE", "INCOME"]).parse(transaction.type),
      personalSheetId: personalSheet.id,
      money,
      category: values.category,
      description: values.description,
      spentAt: dateTimeLocalToZonedISOString(values.spentAt),
    });
    dialog.dismiss();

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getPersonalSheetTransactions.queryKey({
        personalSheetId: personalSheet.id,
      }),
      trpc.transaction.getTransaction.queryKey({
        sheetId: personalSheet.id,
        transactionId: transaction.id,
      }),
    );
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

                  {convertedMoneySnapshot ? (
                    <FormDescription>
                      <CurrencySpan money={convertedMoneySnapshot} />
                    </FormDescription>
                  ) : null}

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
          isLoading={isPending}
        >
          Update
        </Button>
      </form>
    </Form>
  );
};

export const EditPersonalTransactionDialog = ({
  sheetId,
  transactionId,
  trigger,
}: {
  sheetId: string;
  transactionId: string;
  trigger: React.ReactNode;
}) => {
  const { trpc } = useTRPC();
  const { data } = useQuery(
    trpc.transaction.getTransaction.queryOptions({
      sheetId,
      transactionId,
    }),
  );

  return (
    <ResponsiveDialog title="Edit Transaction" trigger={trigger}>
      {data ? <EditPersonalTransactionForm data={data} /> : null}
    </ResponsiveDialog>
  );
};
