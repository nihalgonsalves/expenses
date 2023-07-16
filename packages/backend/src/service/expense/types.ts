import { z } from 'zod';

import { ZParticipantWithName } from '../group/types';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
});

export const ZCreateExpenseInput = z.object({
  groupId: z.string().uuid(),
  paidById: z.string().uuid(),
  money: ZMoney,
  spentAt: z.string(),
  description: z.string(),
  category: z.string(),
  splits: z.array(
    z.object({
      participantId: z.string(),
      share: ZMoney,
    }),
  ),
});

export type CreateExpenseInput = z.infer<typeof ZCreateExpenseInput>;

export const ZCreateExpenseResponse = z.object({
  id: z.string().uuid(),
  description: z.string(),
});

const ZExpenseListItem = z.object({
  id: z.string().uuid(),
  money: ZMoney,
  spentAt: z.string(),
  description: z.string(),
  category: z.string(),
  paidBy: z.array(ZParticipantWithName),
  paidFor: z.array(ZParticipantWithName),
});

export type ExpenseListItem = z.infer<typeof ZExpenseListItem>;

export const ZGetExpensesResponse = z.object({
  expenses: z.array(ZExpenseListItem),
  total: z.number().nonnegative(),
});

export type GetExpensesResponse = z.infer<typeof ZGetExpensesResponse>;

export const ZExpenseSummaryResponse = z.array(
  z.object({
    participantId: z.string().uuid(),
    name: z.string(),
    cost: ZMoney,
    spent: ZMoney,
    balance: ZMoney,
  }),
);

export type ExpenseSummaryResponse = z.infer<typeof ZExpenseSummaryResponse>;
