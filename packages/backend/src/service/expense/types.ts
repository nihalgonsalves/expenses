import { ExpenseType } from '@prisma/client';
import { z } from 'zod';

import { ZParticipantWithName } from '../sheet/types';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
});

export const ZCreateGroupSheetExpenseInput = z.object({
  groupSheetId: z.string().nonempty(),
  paidById: z.string().nonempty(),
  money: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
  splits: z.array(
    z.object({
      participantId: z.string(),
      share: ZMoney,
    }),
  ),
});

export type CreateGroupSheetExpenseInput = z.infer<
  typeof ZCreateGroupSheetExpenseInput
>;

export const ZCreateGroupSheetExpenseResponse = z.object({
  id: z.string().nonempty(),
  description: z.string(),
});

export const ZCreateGroupSheetSettlementInput = z.object({
  groupSheetId: z.string().nonempty(),
  fromId: z.string().nonempty(),
  toId: z.string().nonempty(),
  money: ZMoney,
});

export type CreateGroupSheetSettlementInput = z.infer<
  typeof ZCreateGroupSheetSettlementInput
>;

export const ZCreateGroupSheetSettlementResponse = z.object({
  id: z.string().nonempty(),
});

const ZGroupSheetExpenseListItem = z.object({
  id: z.string().nonempty(),
  money: ZMoney,
  participants: z.array(ZParticipantWithName.extend({ balance: ZMoney })),
  yourBalance: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
  type: z.nativeEnum(ExpenseType),
});

export type GroupSheetExpenseListItem = z.infer<
  typeof ZGroupSheetExpenseListItem
>;

export const ZGetGroupSheetExpensesResponse = z.object({
  expenses: z.array(ZGroupSheetExpenseListItem),
  total: z.number().nonnegative(),
});

export type GetGroupSheetExpensesResponse = z.infer<
  typeof ZGetGroupSheetExpensesResponse
>;

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
