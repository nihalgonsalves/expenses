import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateExpenseInput,
  ZCreateExpenseResponse,
  ZExpenseSummaryResponse,
  ZGetExpensesResponse,
} from '../service/expense/types';
import { protectedProcedure, router } from '../trpc';

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
      const { group } = await ctx.groupService.ensureGroupMembership(
        input.groupId,
        ctx.user.id,
      );

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
    .input(
      z.object({
        groupId: z.string().uuid(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetExpensesResponse)
    .query(async ({ input: { groupId, limit }, ctx }) => {
      const { group } = await ctx.groupService.ensureGroupMembership(
        groupId,
        ctx.user.id,
      );

      return (await ctx.expenseService.getExpenses({ groupId, limit })).map(
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
      const { group } = await ctx.groupService.ensureGroupMembership(
        input,
        ctx.user.id,
      );

      return ctx.expenseService.getParticipantSummaries(group);
    }),
});
