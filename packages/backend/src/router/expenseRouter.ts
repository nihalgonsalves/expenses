import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { zeroMoney } from '../money';
import {
  ZCreateExpenseInput,
  ZCreateExpenseResponse,
  ZCreateSettlementInput,
  ZCreateSettlementResponse,
  ZExpenseSummaryResponse,
  ZGetExpensesResponse,
} from '../service/expense/types';
import { protectedProcedure, router } from '../trpc';

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

      return ctx.expenseService.createExpense(ctx.user, input, group);
    }),

  createSettlement: protectedProcedure
    .input(ZCreateSettlementInput)
    .output(ZCreateSettlementResponse)
    .mutation(async ({ input, ctx }) => {
      const { group } = await ctx.groupService.ensureGroupMembership(
        input.groupId,
        ctx.user.id,
      );

      const groupParticipants = new Set(group.participants.map(({ id }) => id));

      if (
        !groupParticipants.has(input.fromId) ||
        !groupParticipants.has(input.toId)
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
        });
      }

      return ctx.expenseService.createSettlement(ctx.user, input, group);
    }),

  deleteExpense: protectedProcedure
    .input(
      z.object({
        groupId: z.string().nonempty(),
        expenseId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { groupId, expenseId }, ctx }) => {
      const { group } = await ctx.groupService.ensureGroupMembership(
        groupId,
        ctx.user.id,
      );

      await ctx.expenseService.deleteExpense(expenseId, group);
    }),

  getExpenses: protectedProcedure
    .input(
      z.object({
        groupId: z.string().nonempty(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetExpensesResponse)
    .query(async ({ input: { groupId, limit }, ctx }) => {
      const { group } = await ctx.groupService.ensureGroupMembership(
        groupId,
        ctx.user.id,
      );

      const { expenses, total } = await ctx.expenseService.getExpenses({
        group,
        limit,
      });

      return {
        expenses: expenses.map(
          ({ participantBalances, amount, scale, spentAt, ...expense }) => {
            return {
              ...expense,
              participants: participantBalances,
              spentAt: spentAt.toISOString(),
              money: { amount, scale, currencyCode: group.currencyCode },
              yourBalance:
                participantBalances.find(({ id }) => id === ctx.user.id)
                  ?.balance ?? zeroMoney(group.currencyCode),
            };
          },
        ),
        total,
      };
    }),

  getParticipantSummaries: protectedProcedure
    .input(z.string().nonempty())
    .output(ZExpenseSummaryResponse)
    .query(async ({ input, ctx }) => {
      const { group } = await ctx.groupService.ensureGroupMembership(
        input,
        ctx.user.id,
      );

      const summaries = await ctx.expenseService.getParticipantSummaries(group);

      return summaries.sort(({ participantId }) =>
        participantId === ctx.user.id ? -1 : 1,
      );
    }),
});
