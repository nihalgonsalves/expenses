import { z } from 'zod';

import { ZParticipant, ZSheet } from './sheet';

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
});

const ZCreateSheetTransactionInput = z.object({
  type: z.union([z.literal('EXPENSE'), z.literal('INCOME')]),
  money: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
});

export type CreateSheetTransactionInput = z.infer<
  typeof ZCreateSheetTransactionInput
>;

export const ZCreatePersonalSheetTransactionInput =
  ZCreateSheetTransactionInput.extend({
    personalSheetId: z.string().nonempty(),
  });

export const ZRecurrenceFrequency = z.union([
  z.literal('WEEKLY'),
  z.literal('MONTHLY'),
]);

export type RecurrenceFrequency = z.infer<typeof ZRecurrenceFrequency>;

const ZRecurrenceRule = z.object({
  freq: ZRecurrenceFrequency,
  dtstart: z.string().nonempty(),
});

export type RecurrenceRule = z.infer<typeof ZRecurrenceRule>;

export const ZCreatePersonalSheetTransactionScheduleInput =
  ZCreatePersonalSheetTransactionInput.omit({ spentAt: true }).extend({
    tzId: z.string().nonempty(),
    recurrenceRule: ZRecurrenceRule,
  });

export type CreatePersonalSheetTransactionScheduleInput = z.infer<
  typeof ZCreatePersonalSheetTransactionScheduleInput
>;

export const ZBatchCreatePersonalSheetTransactionInput = z.object({
  personalSheetId: z.string().nonempty(),
  transactions: z.array(ZCreateSheetTransactionInput),
});

export type CreatePersonalSheetTransactionInput = z.infer<
  typeof ZCreatePersonalSheetTransactionInput
>;

export const ZCreateGroupSheetTransactionInput =
  ZCreateSheetTransactionInput.extend({
    paidOrReceivedById: z.string().nonempty(),
    groupSheetId: z.string().nonempty(),
    splits: z.array(
      z.object({
        participantId: z.string(),
        share: ZMoney,
      }),
    ),
  });

export type CreateGroupSheetTransactionInput = z.infer<
  typeof ZCreateGroupSheetTransactionInput
>;

export const ZCreateSheetTransactionResponse = z.object({
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

export const ZTransactionType = z.union([
  z.literal('EXPENSE'),
  z.literal('INCOME'),
  z.literal('TRANSFER'),
]);

export type TransactionType = z.infer<typeof ZTransactionType>;

export const ZTransactionListItem = z.object({
  id: z.string().nonempty(),
  money: ZMoney,
  spentAt: z.string().nonempty(),
  description: z.string(),
  category: z.string().nonempty(),
  type: ZTransactionType,
});

export type TransactionListItem = z.infer<typeof ZTransactionListItem>;

export const ZTransactionScheduleListItem = ZTransactionListItem.omit({
  spentAt: true,
}).extend({
  tzId: z.string().nonempty(),
  recurrenceRule: ZRecurrenceRule,
  nextOccurrenceAt: z.string().nonempty(),
});

export type TransactionScheduleListItem = z.infer<
  typeof ZTransactionScheduleListItem
>;

export const ZTransactionWithSheet = z.object({
  transaction: ZTransactionListItem,
  sheet: ZSheet,
});

export const ZGetAllUserTransactionsResponse = z.object({
  expenses: z.array(ZTransactionWithSheet),
  earnings: z.array(ZTransactionWithSheet),
});

export type GetAllUserTransactionsResponse = z.infer<
  typeof ZGetAllUserTransactionsResponse
>;

export const ZGetPersonalSheetTransactionsResponse = z.object({
  transactions: z.array(ZTransactionListItem),
  total: z.number().nonnegative(),
});

export type GetPersonalSheetTransactionsResponse = z.infer<
  typeof ZGetPersonalSheetTransactionsResponse
>;

export const ZBalance = z.object({
  actual: ZMoney,
  share: ZMoney,
});

const ZTransactionParticipantType = z.union([
  z.literal('participant'),
  z.literal('transfer_from'),
  z.literal('transfer_to'),
]);

const ZGroupSheetParticipantItem = ZParticipant.extend({
  balance: ZBalance,
  type: ZTransactionParticipantType,
});

export type GroupSheetParticipantItem = z.infer<
  typeof ZGroupSheetParticipantItem
>;

const ZGroupSheetTransactionListItem = ZTransactionListItem.extend({
  participants: z.array(ZGroupSheetParticipantItem),
  yourBalance: ZBalance.optional(),
});

export type GroupSheetTransactionListItem = z.infer<
  typeof ZGroupSheetTransactionListItem
>;

export const ZGetGroupSheetTransactionsResponse = z.object({
  transactions: z.array(ZGroupSheetTransactionListItem),
  total: z.number().nonnegative(),
});

export const ZTransactionSummaryResponse = z.array(
  z.object({
    participantId: z.string().nonempty(),
    name: z.string(),
    balance: ZMoney,
  }),
);

export type TransactionSummaryResponse = z.infer<
  typeof ZTransactionSummaryResponse
>;
