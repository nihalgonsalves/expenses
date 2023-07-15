import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateExpenseInput,
  ZCreateExpenseResponse,
  ZGetExpensesResponse,
} from '../service/expense/types';
import { protectedProcedure, router } from '../trpc';

export const expenseRouter = router({
  createExpense: protectedProcedure
    .input(ZCreateExpenseInput)
    .output(ZCreateExpenseResponse)
    .mutation(async ({ input, ctx }) => {
      const [, membership] = await ctx.groupService.groupMembership(
        input.groupId,
        ctx.user.id,
      );

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      return ctx.expenseService.createExpense(input);
    }),

  getExpenses: protectedProcedure
    .input(z.string())
    .output(ZGetExpensesResponse)
    .query(async ({ input, ctx }) => {
      const [, membership] = await ctx.groupService.groupMembership(
        input,
        ctx.user.id,
      );

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      return (await ctx.expenseService.getExpenses(input)).map(
        ({ amount, scale, currency, ...expense }) => ({
          ...expense,
          money: { amount, scale, currencyCode: currency },
        }),
      );
    }),
});
