import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import { ZCreateGroupSheetSettlementInput } from "@nihalgonsalves/expenses-shared/types/transaction";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { useTRPC } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { toMoneyValues } from "../../utils/money";
import { MoneyField } from "../form/MoneyField";
import { useDialog } from "../form/ResponsiveDialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { ParticipantSelect } from "./ParticipantSelect";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      groupSheetId: groupSheet.id,
      fromId: me.id,
      toId: "",
      amount: 0,
    },
  });

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: createGroupSheetSettlement, isPending } = useMutation(
    trpc.transaction.createGroupSheetSettlement.mutationOptions(),
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
      trpc.transaction.getAllUserTransactions.queryKey(),
      trpc.transaction.getGroupSheetTransactions.queryKey({
        groupSheetId: groupSheet.id,
      }),
      trpc.transaction.getParticipantSummaries.queryKey(groupSheet.id),
      trpc.transaction.getSimplifiedBalances.queryKey(groupSheet.id),
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
                  autoFocus
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
