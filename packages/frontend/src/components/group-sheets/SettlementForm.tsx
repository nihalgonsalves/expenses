import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';
import { ZCreateGroupSheetSettlementInput } from '@nihalgonsalves/expenses-shared/types/transaction';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { toMoneyValues } from '../../utils/money';
import { MoneyField } from '../form/MoneyField';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';

import { ParticipantSelect } from './ParticipantSelect';

export const SettlementForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const formSchema = ZCreateGroupSheetSettlementInput.omit({
    money: true,
  }).extend({
    amount: z.number().positive({ message: 'Amount is required' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupSheetId: groupSheet.id,
      fromId: me.id,
      toId: '',
      amount: 0,
    },
  });

  const utils = trpc.useUtils();
  const { mutateAsync: createGroupSheetSettlement, isLoading } =
    trpc.transaction.createGroupSheetSettlement.useMutation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const [, moneySnapshot] = toMoneyValues(
      values.amount,
      groupSheet.currencyCode,
    );

    await createGroupSheetSettlement({
      ...values,
      money: moneySnapshot,
    });

    await Promise.all([
      utils.transaction.getAllUserTransactions.invalidate(),
      utils.transaction.getGroupSheetTransactions.invalidate({
        groupSheetId: groupSheet.id,
      }),
      utils.transaction.getParticipantSummaries.invalidate(groupSheet.id),
    ]);

    navigate(`/groups/${groupSheet.id}`, { replace: true });
  };

  const disabled = !onLine;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fromId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>From</FormLabel>
              <FormControl>
                <ParticipantSelect
                  groupSheet={groupSheet}
                  value={field.value}
                  onChange={field.onChange}
                />
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

        <Button
          className=" w-full"
          type="submit"
          disabled={disabled}
          isLoading={isLoading}
        >
          Log Settlement
        </Button>
      </form>
    </Form>
  );
};
