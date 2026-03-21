import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusIcon, CheckIcon } from "lucide-react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import type { z } from "zod";

import { moneyToDinero } from "@nihalgonsalves/expenses-shared/money";
import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import type {
  TransactionType,
  TransactionWithSheet,
} from "@nihalgonsalves/expenses-shared/types/transaction";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { useCurrencyConversion } from "../../api/currency-conversion";
import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/use-navigator-on-line";
import { toMoneyValues } from "../../utils/money";
import {
  CURRENT_TIMEZONE,
  dateTimeLocalToZonedISOString,
  nowForDateTimeInput,
} from "../../utils/temporal";
import { CurrencySpan } from "../currency-span";
import { CategorySelect, OTHER_CATEGORY } from "../form/category-select";
import { CurrencySelect } from "../form/currency-select";
import { MoneyField } from "../form/money-field";
import {
  ResponsiveDialog,
  useDialog,
  type DialogControls,
} from "../form/responsive-dialog";
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
import { Separator } from "../ui/separator";
import { ParticipantSelect } from "./participant-select";
import { usePreferredCurrencyCode } from "#/state/preferences";
import {
  calcSplits,
  getDefaultRatios,
  SplitsFormSection,
} from "./splits-form-section";
import {
  formSchema,
  GroupTransactionSplitType,
} from "./transaction-form/form-schema";
import { LoadingSpinner } from "../ui/loading-spinner";
import { haptics } from "bzzz";

const MetadataFormSection = ({
  groupSheet,
}: {
  groupSheet: GroupSheetByIdResponse;
}) => {
  const form = useFormContext<z.infer<typeof formSchema>>();
  const type = useWatch({ name: "type", control: form.control });

  return (
    <>
      <FormField
        control={form.control}
        name="paidOrReceivedById"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>
              {type === "EXPENSE" ? "Who paid?" : "Who received money?"}
            </FormLabel>
            <FormControl>
              <ParticipantSelect
                groupSheet={groupSheet}
                {...field}
                onChange={(newId) => {
                  if (!newId) return;

                  field.onChange(newId);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <CategorySelect placeholder="Select a category" {...field} />
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
            <FormLabel>When?</FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                className="appearance-none"
                data-chromatic="ignore"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export const TransactionForm = ({
  groupSheet,
  me,
  type,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
  type: Exclude<TransactionType, "TRANSFER">;
}) => {
  const dialog = useDialog();
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: createGroupSheetTransaction, isPending } = useMutation(
    trpc.transaction.createGroupSheetTransaction.mutationOptions(),
  );

  const onLine = useNavigatorOnLine();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      type,
      currencyCode: preferredCurrencyCode,
      category: OTHER_CATEGORY,
      amount: 0,
      description: "",
      spentAt: nowForDateTimeInput(),
      paidOrReceivedById: me.id,
      splitType: GroupTransactionSplitType.Evenly,
      ratios: getDefaultRatios(groupSheet.participants),
    },
  });

  const amount = useWatch({ name: "amount", control: form.control });
  const currencyCode = useWatch({
    name: "currencyCode",
    control: form.control,
  });
  const spentAt = useWatch({ name: "spentAt", control: form.control });

  const currencyCodeOrGroupDefault = currencyCode || groupSheet.currencyCode;

  const [dineroValue, moneySnapshot] = toMoneyValues(
    amount,
    currencyCodeOrGroupDefault,
  );

  const {
    supportedCurrencies,
    rate,
    targetSnapshot: convertedMoneySnapshot,
  } = useCurrencyConversion(
    Temporal.PlainDate.from(spentAt),
    currencyCodeOrGroupDefault,
    groupSheet.currencyCode,
    moneySnapshot,
  );
  const disabled = !onLine;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const splits = calcSplits(
      groupSheet.participants,
      currencyCodeOrGroupDefault,
      dineroValue,
      values.ratios,
    );

    const basePayload = {
      type,
      groupSheetId: groupSheet.id,
      paidOrReceivedById: values.paidOrReceivedById,
      description: values.description,
      category: values.category,
      spentAt: dateTimeLocalToZonedISOString(values.spentAt),
    };

    try {
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
            groupSheet.participants,
            currencyCodeOrGroupDefault,
            moneyToDinero(convertedMoneySnapshot),
            values.ratios,
          ),
        });
      }
    } catch (e) {
      haptics.error();
      throw e;
    }

    haptics.success();
    dialog.dismiss();

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId: groupSheet.id,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheet.id),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheet.id),
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          haptics.error();
        })}
        className="space-y-4"
      >
        <div className="flex gap-4">
          <div className="grow">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {type === "EXPENSE"
                      ? "How much was spent?"
                      : "How much was received?"}
                  </FormLabel>
                  <FormControl>
                    <MoneyField
                      className="grow"
                      currencyCode={currencyCodeOrGroupDefault}
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
                  {supportedCurrencies.includes(groupSheet.currencyCode) && (
                    <CurrencySelect options={supportedCurrencies} {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <MetadataFormSection groupSheet={groupSheet} />

        <Separator />

        <SplitsFormSection groupSheet={groupSheet} rate={rate} />

        <Button
          className="w-full capitalize"
          isLoading={isPending}
          type="submit"
          disabled={disabled}
        >
          <PlusIcon className="mr-2" /> Add {type.toLocaleLowerCase()}
        </Button>
      </form>
    </Form>
  );
};

export const EditTransactionForm = ({
  groupSheet,
  transaction,
}: {
  groupSheet: GroupSheetByIdResponse;
  transaction: TransactionWithSheet & {
    type: "EXPENSE" | "INCOME";
    sheetType: "GROUP";
  };
}) => {
  const dialog = useDialog();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: replaceGroupSheetTransaction, isPending } = useMutation(
    trpc.transaction.replaceGroupSheetTransaction.mutationOptions(),
  );

  const onLine = useNavigatorOnLine();

  const payersOrReceivers = transaction.participants.filter(
    ({ balance }) => balance.actual.amount !== 0,
  );
  const payerOrReceiver = payersOrReceivers.at(0);
  if (!payerOrReceiver || payersOrReceivers.length !== 1) {
    throw new Error(
      "Cannot edit transaction: expected exactly one payer or receiver",
    );
  }

  const ratios = transaction.participants.map(({ id, balance }) => ({
    participantId: id,
    ratio: Math.abs(balance.share.amount),
  }));

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      type: transaction.type,
      category: transaction.category,
      currencyCode: transaction.money.currencyCode,
      amount: transaction.money.amount,
      description: transaction.description,
      spentAt: Temporal.Instant.from(transaction.spentAt)
        .toZonedDateTimeISO(CURRENT_TIMEZONE)
        .toPlainDateTime()
        .round("minutes")
        .toString(),
      paidOrReceivedById: payerOrReceiver.id,
      // we don't know the original splitType when editing
      splitType: GroupTransactionSplitType.Amounts,
      ratios,
    },
  });

  const amount = useWatch({ name: "amount", control: form.control });
  const spentAt = useWatch({ name: "spentAt", control: form.control });
  const currencyCode = useWatch({
    name: "currencyCode",
    control: form.control,
  });
  const currencyCodeOrOriginal = currencyCode || transaction.money.currencyCode;

  const [dineroValue, moneySnapshot] = toMoneyValues(
    amount,
    currencyCodeOrOriginal,
  );

  const {
    supportedCurrencies,
    rate,
    targetSnapshot: convertedMoneySnapshot,
  } = useCurrencyConversion(
    Temporal.PlainDate.from(spentAt),
    currencyCodeOrOriginal,
    groupSheet.currencyCode,
    moneySnapshot,
  );
  const disabled = !onLine;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const splits = calcSplits(
      groupSheet.participants,
      currencyCodeOrOriginal,
      dineroValue,
      values.ratios,
    );

    const basePayload = {
      type: transaction.type,
      groupSheetId: groupSheet.id,
      paidOrReceivedById: values.paidOrReceivedById,
      description: values.description,
      category: values.category,
      spentAt: dateTimeLocalToZonedISOString(values.spentAt),
    };

    try {
      if (groupSheet.currencyCode === currencyCode) {
        await replaceGroupSheetTransaction({
          ...basePayload,
          transactionId: transaction.id,
          money: moneySnapshot,
          splits,
        });
      } else if (convertedMoneySnapshot) {
        await replaceGroupSheetTransaction({
          ...basePayload,
          transactionId: transaction.id,
          money: convertedMoneySnapshot,
          splits: calcSplits(
            groupSheet.participants,
            currencyCodeOrOriginal,
            moneyToDinero(convertedMoneySnapshot),
            values.ratios,
          ),
        });
      }
    } catch (e) {
      haptics.error();
      throw e;
    }

    haptics.success();
    dialog.dismiss();

    await invalidate(
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getTransaction.queryKey({
        sheetId: groupSheet.id,
        transactionId: transaction.id,
      }),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId: groupSheet.id,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheet.id),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheet.id),
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          haptics.error();
        })}
        className="space-y-4"
      >
        <div className="flex gap-4">
          <div className="grow">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {transaction.type === "EXPENSE"
                      ? "How much was spent?"
                      : "How much was received?"}
                  </FormLabel>
                  <FormControl>
                    <MoneyField
                      className="grow"
                      currencyCode={currencyCodeOrOriginal}
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
                  {supportedCurrencies.includes(groupSheet.currencyCode) && (
                    <CurrencySelect options={supportedCurrencies} {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <MetadataFormSection groupSheet={groupSheet} />

        <Separator />

        <SplitsFormSection groupSheet={groupSheet} rate={rate} />

        <Button
          className="w-full capitalize"
          isLoading={isPending}
          type="submit"
          disabled={disabled}
        >
          <CheckIcon className="mr-2" /> Update
        </Button>
      </form>
    </Form>
  );
};

const isNonTransferGroupTransaction = (
  transaction: TransactionWithSheet,
): transaction is TransactionWithSheet & {
  type: "EXPENSE" | "INCOME";
  sheetType: "GROUP";
} => transaction.sheetType === "GROUP" && transaction.type !== "TRANSFER";

export const EditTransactionDialog = ({
  sheetId,
  transactionId,
  dialogProps,
}: {
  sheetId: string;
  transactionId: string;
  dialogProps: DialogControls;
}) => {
  const { trpc } = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.transaction.getTransaction.queryOptions({
      sheetId,
      transactionId,
    }),
  );
  const { data: groupSheetData } = useQuery(
    trpc.sheet.groupSheetById.queryOptions(sheetId),
  );

  return (
    <ResponsiveDialog title="Edit Transaction" {...dialogProps}>
      {isLoading ? (
        <LoadingSpinner />
      ) : data && groupSheetData ? (
        isNonTransferGroupTransaction(data) ? (
          <EditTransactionForm transaction={data} groupSheet={groupSheetData} />
        ) : (
          <>Transfers cannot be edited</>
        )
      ) : null}
    </ResponsiveDialog>
  );
};
