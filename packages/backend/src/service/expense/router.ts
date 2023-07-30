import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc';
import { zeroMoney } from '../../utils/money';

import {
  ZCreateGroupSheetExpenseInput,
  ZCreateGroupSheetExpenseResponse,
  ZCreateGroupSheetSettlementInput,
  ZCreateGroupSheetSettlementResponse,
  ZExpenseSummaryResponse,
  ZGetGroupSheetExpensesResponse,
} from './types';

export const expenseRouter = router({
  createGroupSheetExpense: protectedProcedure
    .input(ZCreateGroupSheetExpenseInput)
    .output(ZCreateGroupSheetExpenseResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupMembership(
        input.groupSheetId,
        ctx.user.id,
      );

      const groupParticipants = new Set(sheet.participants.map(({ id }) => id));
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

      return ctx.expenseService.createGroupSheetExpense(ctx.user, input, sheet);
    }),

  createGroupSheetSettlement: protectedProcedure
    .input(ZCreateGroupSheetSettlementInput)
    .output(ZCreateGroupSheetSettlementResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupMembership(
        input.groupSheetId,
        ctx.user.id,
      );

      const groupParticipants = new Set(sheet.participants.map(({ id }) => id));

      if (
        !groupParticipants.has(input.fromId) ||
        !groupParticipants.has(input.toId)
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
        });
      }

      return ctx.expenseService.createSettlement(ctx.user, input, sheet);
    }),

  // TODO: rename or reuse for both?
  deleteExpense: protectedProcedure
    .input(
      z.object({
        groupSheetId: z.string().nonempty(),
        expenseId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { groupSheetId, expenseId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupMembership(
        groupSheetId,
        ctx.user.id,
      );

      await ctx.expenseService.deleteExpense(expenseId, sheet);
    }),

  getGroupSheetExpenses: protectedProcedure
    .input(
      z.object({
        groupSheetId: z.string().nonempty(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetGroupSheetExpensesResponse)
    .query(async ({ input: { groupSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupMembership(
        groupSheetId,
        ctx.user.id,
      );

      const { expenses, total } =
        await ctx.expenseService.getGroupSheetExpenses({
          groupSheet: sheet,
          limit,
        });

      return {
        expenses: expenses.map(
          ({ participantBalances, amount, scale, spentAt, ...expense }) => {
            return {
              ...expense,
              participants: participantBalances,
              spentAt: spentAt.toISOString(),
              money: { amount, scale, currencyCode: sheet.currencyCode },
              yourBalance:
                participantBalances.find(({ id }) => id === ctx.user.id)
                  ?.balance ?? zeroMoney(sheet.currencyCode),
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
      const { sheet } = await ctx.sheetService.ensureGroupMembership(
        input,
        ctx.user.id,
      );

      const summaries = await ctx.expenseService.getParticipantSummaries(sheet);

      return summaries.sort(({ participantId }) =>
        participantId === ctx.user.id ? -1 : 1,
      );
    }),
});
