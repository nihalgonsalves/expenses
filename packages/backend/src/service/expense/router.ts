import { Temporal } from '@js-temporal/polyfill';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateGroupSheetExpenseOrIncomeInput,
  ZCreateSheetExpenseResponse,
  ZCreateGroupSheetSettlementInput,
  ZCreateGroupSheetSettlementResponse,
  ZCreatePersonalSheetExpenseInput,
  ZExpenseSummaryResponse,
  ZGetPersonalSheetExpensesResponse,
  ZGetGroupSheetExpensesResponse,
  ZBatchCreatePersonalSheetExpenseInput,
  ZGetAllUserExpensesResponse,
} from '@nihalgonsalves/expenses-shared/types/expense';

import { protectedProcedure, router } from '../../trpc';

export const expenseRouter = router({
  createPersonalSheetExpense: protectedProcedure
    .input(ZCreatePersonalSheetExpenseInput)
    .output(ZCreateSheetExpenseResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      return ctx.expenseService.createPersonalSheetExpense(
        ctx.user,
        input,
        sheet,
      );
    }),

  batchCreatePersonalSheetExpenses: protectedProcedure
    .input(ZBatchCreatePersonalSheetExpenseInput)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        input.personalSheetId,
        ctx.user.id,
      );

      await ctx.expenseService.batchCreatePersonalSheetExpenses(
        ctx.user,
        input.expenses,
        sheet,
      );
    }),

  createGroupSheetExpenseOrIncome: protectedProcedure
    .input(ZCreateGroupSheetExpenseOrIncomeInput)
    .output(ZCreateSheetExpenseResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input.groupSheetId,
        ctx.user.id,
      );

      const groupParticipants = new Set(sheet.participants.map(({ id }) => id));
      const expenseParticipants = [
        input.paidOrReceivedById,
        ...input.splits.map(({ participantId }) => participantId),
      ];

      if (expenseParticipants.some((id) => !groupParticipants.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid participants',
        });
      }

      return ctx.expenseService.createGroupSheetExpenseOrIncome(
        ctx.user,
        input,
        sheet,
      );
    }),

  createGroupSheetSettlement: protectedProcedure
    .input(ZCreateGroupSheetSettlementInput)
    .output(ZCreateGroupSheetSettlementResponse)
    .mutation(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
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

  deleteExpense: protectedProcedure
    .input(
      z.object({
        sheetId: z.string().nonempty(),
        expenseId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { sheetId, expenseId }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureSheetMembership(
        sheetId,
        ctx.user.id,
      );

      await ctx.expenseService.deleteExpense(expenseId, sheet);
    }),

  getAllUserExpenses: protectedProcedure
    .input(
      z.object({
        fromTimestamp: z.string().datetime(),
        toTimestamp: z.string().datetime(),
      }),
    )
    .output(ZGetAllUserExpensesResponse)
    .query(async ({ ctx, input }) => {
      const { expenses, earnings } =
        await ctx.expenseService.getAllUserExpenses(ctx.user, {
          from: Temporal.Instant.from(input.fromTimestamp),
          to: Temporal.Instant.from(input.toTimestamp),
        });

      return {
        expenses: expenses.map(({ spentAt, sheet, ...expense }) => ({
          expense: { ...expense, spentAt: spentAt.toISOString() },
          sheet,
        })),
        earnings: earnings.map(({ spentAt, sheet, ...expense }) => ({
          expense: { ...expense, spentAt: spentAt.toISOString() },
          sheet,
        })),
      };
    }),

  getPersonalSheetExpenses: protectedProcedure
    .input(
      z.object({
        personalSheetId: z.string().nonempty(),
        limit: z.number().positive().optional(),
      }),
    )
    .output(ZGetPersonalSheetExpensesResponse)
    .query(async ({ input: { personalSheetId, limit }, ctx }) => {
      const { sheet } = await ctx.sheetService.ensurePersonalSheetMembership(
        personalSheetId,
        ctx.user.id,
      );

      const { expenses, total } =
        await ctx.expenseService.getPersonalSheetExpenses({
          personalSheet: sheet,
          limit,
        });

      return {
        expenses: expenses.map(({ amount, scale, spentAt, ...expense }) => ({
          ...expense,
          spentAt: spentAt.toISOString(),
          money: { amount, scale, currencyCode: sheet.currencyCode },
        })),
        total,
      };
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
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
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
          ({ participantBalances, amount, scale, spentAt, ...expense }) => ({
            ...expense,
            participants: participantBalances,
            spentAt: spentAt.toISOString(),
            money: { amount, scale, currencyCode: sheet.currencyCode },
            yourBalance: participantBalances.find(
              ({ id }) => id === ctx.user.id,
            )?.balance,
          }),
        ),
        total,
      };
    }),

  getParticipantSummaries: protectedProcedure
    .input(z.string().nonempty())
    .output(ZExpenseSummaryResponse)
    .query(async ({ input, ctx }) => {
      const { sheet } = await ctx.sheetService.ensureGroupSheetMembership(
        input,
        ctx.user.id,
      );

      const summaries = await ctx.expenseService.getParticipantSummaries(sheet);

      return summaries.sort(({ participantId }) =>
        participantId === ctx.user.id ? -1 : 1,
      );
    }),
});
