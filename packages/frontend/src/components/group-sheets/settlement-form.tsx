import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import { ZCreateGroupSheetSettlementInput } from "@nihalgonsalves/expenses-shared/types/transaction";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { currencyConversionQueries } from "../../api/currency-conversion";
import { useQueryClient } from "../../api/query-client";
import {
  transactionMutations,
  transactionQueries,
} from "../../api/transaction";
import { useNavigatorOnLine } from "../../state/use-navigator-on-line";
import { toMoneyValues } from "../../utils/money";
import { MoneyField } from "../form/money-field";
import { useDialog } from "../form/responsive-dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { ParticipantSelect } from "./participant-select";

export const SettlementForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const onLine = useNavigatorOnLine();

  const dialog = useDialog();

  const formSchema = ZCreateGroupSheetSettlementInput.omit({
    money: true,
  }).extend({
    amount: z.number().positive({ message: "Amount is required" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      groupSheetId: groupSheet.id,
      fromId: me.id,
      toId: "",
      amount: 0,
    },
  });

  const { invalidate } = useQueryClient();
  const { mutateAsync: createGroupSheetSettlement, isPending } = useMutation(
    transactionMutations.createGroupSheetSettlement(),
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const [, moneySnapshot] = toMoneyValues(
      values.amount,
      groupSheet.currencyCode,
    );

    await createGroupSheetSettlement({
      ...values,
      money: moneySnapshot,
    });

    await invalidate(
      transactionQueries.allUserTransactions.queryKey(),
      transactionQueries.futureTransactions.queryKey(),
      transactionQueries.groupSheetTransactions.queryKey({
        groupSheetId: groupSheet.id,
      }),
      transactionQueries.participantSummaries.queryKey(groupSheet.id),
      transactionQueries.simplifiedBalances.queryKey(groupSheet.id),
      currencyConversionQueries.supportedCurrencies.queryKey(),
    );

    dialog.dismiss();
  };

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>How much was given?</FormLabel>
              <FormControl>
                <MoneyField
                  className="grow"
                  currencyCode={groupSheet.currencyCode}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fromId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>From</FormLabel>
              <FormControl>
                <ParticipantSelect groupSheet={groupSheet} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="toId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>To</FormLabel>
              <FormControl>
                <ParticipantSelect groupSheet={groupSheet} {...field} />
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
          Log Settlement
        </Button>
      </form>
    </Form>
  );
};
