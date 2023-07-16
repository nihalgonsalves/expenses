import { type GroupParticipantRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { type ContextObj } from '../context';
import {
  ZCreateExpenseInput,
  ZCreateExpenseResponse,
  ZExpenseSummaryResponse,
  ZGetExpensesResponse,
} from '../service/expense/types';
import { type GroupWithParticipants } from '../service/group/types';
import { type User } from '../service/user/types';
import { protectedProcedure, router } from '../trpc';

const assertGroupView = async (
  ctx: ContextObj & { user: User },
  groupId: string,
): Promise<{ group: GroupWithParticipants; role: GroupParticipantRole }> => {
  const { group, role } = await ctx.groupService.groupMembership(
    groupId,
    ctx.user.id,
  );

  if (!role) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Group not found',
    });
  }

  return { group, role };
};

const mapUniqueParticipants = (
  list: { user: { id: string; name: string } }[],
) => [
  ...new Map(list.map(({ user: { id, name } }) => [id, { id, name }])).values(),
];

export const expenseRouter = router({
  createExpense: protectedProcedure
    .input(ZCreateExpenseInput)
    .output(ZCreateExpenseResponse)
    .mutation(async ({ input, ctx }) => {
      const { group } = await assertGroupView(ctx, input.groupId);

      const groupParticipants = new Set(group.participants.map(({ id }) => id));
      const expenseParticipants = [
        input.paidById,
        ...input.splits.map(({ participantId }) => participantId),
      ];

      if (expenseParticipants.some((id) => !groupParticipants.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
        });
      }

      return ctx.expenseService.createExpense(input, group);
    }),

  getExpenses: protectedProcedure
    .input(z.string().uuid())
    .output(ZGetExpensesResponse)
    .query(async ({ input, ctx }) => {
      const { group } = await assertGroupView(ctx, input);

      return (await ctx.expenseService.getExpenses(input)).map(
        ({ amount, scale, transactions, ...expense }) => {
          const paidBy = transactions.filter(
            ({ amount: txnAmount }) => txnAmount < 0,
          );

          const paidFor = transactions.filter(
            ({ amount: txnAmount }) => txnAmount > 0,
          );

          return {
            ...expense,
            spentAt: expense.spentAt.toISOString(),
            money: { amount, scale, currencyCode: group.currencyCode },
            paidBy: mapUniqueParticipants(paidBy),
            paidFor: mapUniqueParticipants(paidFor),
          };
        },
      );
    }),

  getParticipantSummaries: protectedProcedure
    .input(z.string().uuid())
    .output(ZExpenseSummaryResponse)
    .query(async ({ input, ctx }) => {
      const { group } = await assertGroupView(ctx, input);

      return ctx.expenseService.getParticipantSummaries(group);
    }),
});
