import { ExpenseType } from '@prisma/client';
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

export const ZCreateSettlementInput = z.object({
  groupId: z.string().uuid(),
  fromId: z.string().uuid(),
  toId: z.string().uuid(),
  money: ZMoney,
});

export type CreateSettlementInput = z.infer<typeof ZCreateSettlementInput>;

export const ZCreateSettlementResponse = z.object({
  id: z.string().uuid(),
});

const ZExpenseListItem = z.object({
  id: z.string().uuid(),
  money: ZMoney,
  spentAt: z.string(),
  description: z.string(),
  category: z.string(),
  type: z.nativeEnum(ExpenseType),
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
    sent: ZMoney,
    received: ZMoney,
    balance: ZMoney,
  }),
);

export type ExpenseSummaryResponse = z.infer<typeof ZExpenseSummaryResponse>;
