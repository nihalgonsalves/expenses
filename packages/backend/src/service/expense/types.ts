import { ExpenseType } from '@prisma/client';
import { z } from 'zod';

import { ZParticipantWithName } from '../group/types';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
});

export const ZCreateExpenseInput = z.object({
  groupId: z.string().nonempty(),
  paidById: z.string().nonempty(),
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
  id: z.string().nonempty(),
  description: z.string(),
});

export const ZCreateSettlementInput = z.object({
  groupId: z.string().nonempty(),
  fromId: z.string().nonempty(),
  toId: z.string().nonempty(),
  money: ZMoney,
});

export type CreateSettlementInput = z.infer<typeof ZCreateSettlementInput>;

export const ZCreateSettlementResponse = z.object({
  id: z.string().nonempty(),
});

const ZExpenseListItem = z.object({
  id: z.string().nonempty(),
  money: ZMoney,
  participants: z.array(ZParticipantWithName.extend({ balance: ZMoney })),
  yourBalance: ZMoney,
  spentAt: z.string(),
  description: z.string(),
  category: z.string(),
  type: z.nativeEnum(ExpenseType),
});

export type ExpenseListItem = z.infer<typeof ZExpenseListItem>;

export const ZGetExpensesResponse = z.object({
  expenses: z.array(ZExpenseListItem),
  total: z.number().nonnegative(),
});

export type GetExpensesResponse = z.infer<typeof ZGetExpensesResponse>;

export const ZExpenseSummaryResponse = z.array(
  z.object({
    participantId: z.string().nonempty(),
    name: z.string(),
    cost: ZMoney,
    spent: ZMoney,
    sent: ZMoney,
    received: ZMoney,
    balance: ZMoney,
  }),
);

export type ExpenseSummaryResponse = z.infer<typeof ZExpenseSummaryResponse>;
