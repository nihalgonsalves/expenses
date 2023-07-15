import { z } from 'zod';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().positive(),
  currencyCode: z.string(),
});

export type Money = z.infer<typeof ZMoney>;

export const ZCreateExpenseInput = z.object({
  groupId: z.string().uuid(),
  paidById: z.string().uuid(),
  money: ZMoney,
  spentAt: z.string(),
  description: z.string(),
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
});

export const ZGetExpensesResponse = z.array(
  z.object({
    id: z.string().uuid(),
    description: z.string(),
    money: ZMoney,
  }),
);

export type GetExpensesResponse = z.infer<typeof ZGetExpensesResponse>;
