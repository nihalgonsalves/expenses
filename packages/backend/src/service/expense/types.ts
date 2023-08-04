import { ExpenseType } from '@prisma/client';
import { z } from 'zod';

import { ZParticipant, ZSheet } from '../sheet/types';

export { type SheetParticipantRole } from '@prisma/client';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
});

const ZCreateSheetExpenseInput = z.object({
  money: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
});

export type CreateSheetExpenseInput = z.infer<typeof ZCreateSheetExpenseInput>;

export const ZCreatePersonalSheetExpenseInput = ZCreateSheetExpenseInput.extend(
  {
    personalSheetId: z.string().nonempty(),
  },
);

export const ZBatchCreatePersonalSheetExpenseInput = z.object({
  personalSheetId: z.string().nonempty(),
  expenses: z.array(ZCreateSheetExpenseInput),
});

export type CreatePersonalSheetExpenseInput = z.infer<
  typeof ZCreatePersonalSheetExpenseInput
>;

export const ZCreateGroupSheetExpenseInput = ZCreateSheetExpenseInput.extend({
  groupSheetId: z.string().nonempty(),
  paidById: z.string().nonempty(),
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

export const ZCreateSheetExpenseResponse = z.object({
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

export const ZExpenseListItem = z.object({
  id: z.string().nonempty(),
  money: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
  type: z.nativeEnum(ExpenseType),
});

export type ExpenseListItem = z.infer<typeof ZExpenseListItem>;

export const ZGetAllUserExpensesResponse = z.object({
  expenses: z.array(z.object({ expense: ZExpenseListItem, sheet: ZSheet })),
  total: z.number().nonnegative(),
});

export type GetAllUserExpensesResponse = z.infer<
  typeof ZGetAllUserExpensesResponse
>;

export const ZGetPersonalSheetExpensesResponse = z.object({
  expenses: z.array(ZExpenseListItem),
  total: z.number().nonnegative(),
});

export type GetPersonalSheetExpensesResponse = z.infer<
  typeof ZGetPersonalSheetExpensesResponse
>;

const ZGroupSheetExpenseListItem = ZExpenseListItem.extend({
  participants: z.array(ZParticipant.extend({ balance: ZMoney })),
  yourBalance: ZMoney,
});

export type GroupSheetExpenseListItem = z.infer<
  typeof ZGroupSheetExpenseListItem
>;

export const ZGetGroupSheetExpensesResponse = z.object({
  expenses: z.array(ZGroupSheetExpenseListItem),
  total: z.number().nonnegative(),
});

export type GetGroupSheetExpensesResponse = z.infer<
  typeof ZGetPersonalSheetExpensesResponse
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
