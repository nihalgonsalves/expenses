import { type RxDocument } from 'rxdb';
import { z } from 'zod';

const ZSplitGroupParticipant = z.object({
  name: z.string(),
});

export type SplitGroupParticipant = z.infer<typeof ZSplitGroupParticipant>;

export const ZDineroCurrency = z.object({
  code: z.string(),
  base: z.union([z.number().int(), z.array(z.number().int())]),
  exponent: z.number().int(),
});

export type DineroCurrency = z.infer<typeof ZDineroCurrency>;

export const ZDineroSnapshot = z.object({
  amount: z.number().int(),
  scale: z.number().int(),
  currency: ZDineroCurrency,
});

export type DineroSnapshot = z.infer<typeof ZDineroSnapshot>;

export const ZSplitGroupExpense = z.object({
  id: z.string().nonempty().max(64),
  money: ZDineroSnapshot,
  createdAt: z.number().positive(),
  spentAt: z.number().positive(),
  category: z.string(),
  notes: z.string(),
});

export type SplitGroupExpense = z.infer<typeof ZSplitGroupExpense>;

/** Group with participants and expenses to split */
export const ZSplitGroup = z.object({
  id: z.string().nonempty().max(64),
  createdAt: z.number().positive(),
  name: z.string().nonempty(),
  currency: z.string().nonempty(),
  owner: ZSplitGroupParticipant,
  participants: z.array(ZSplitGroupParticipant),
  expenses: z.array(ZSplitGroupExpense),
});

export type SplitGroup = z.infer<typeof ZSplitGroup>;

export type SplitGroupDocument = RxDocument<SplitGroup>;
