import { z } from "zod";

import { ZCurrencyCode } from "../money.ts";

import { ZParticipant, ZSheet, type SheetType } from "./sheet.ts";

export const ZMoney = z.object({
  amount: z.number().int(),
  scale: z.number().int().nonnegative(),
  currencyCode: ZCurrencyCode,
});

const ZCreateSheetTransactionInput = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  money: ZMoney,
  spentAt: z.string().min(1, { message: "Required" }),
  description: z.string(),
  category: z.string().min(1, { message: "Required" }),
});

export type CreateSheetTransactionInput = z.infer<
  typeof ZCreateSheetTransactionInput
>;

export const ZCreatePersonalSheetTransactionInput =
  ZCreateSheetTransactionInput.extend({
    personalSheetId: z.string().min(1),
  });

export type CreatePersonalSheetTransactionInput = z.infer<
  typeof ZCreatePersonalSheetTransactionInput
>;

export const ZUpdatePersonalSheetTransactionInput =
  ZCreatePersonalSheetTransactionInput.extend({
    id: z.string().min(1),
  });

export type UpdatePersonalSheetTransactionInput = z.infer<
  typeof ZUpdatePersonalSheetTransactionInput
>;

export const ZRecurrenceFrequency = z.enum(["WEEKLY", "MONTHLY"]);

export type RecurrenceFrequency = z.infer<typeof ZRecurrenceFrequency>;

export const ZRecurrenceRule = z.object({
  freq: ZRecurrenceFrequency,
});

export type RecurrenceRule = z.infer<typeof ZRecurrenceRule>;

export const ZCreatePersonalSheetTransactionScheduleInput =
  ZCreatePersonalSheetTransactionInput.omit({ spentAt: true }).extend({
    // TODO: add Zod type
    /** ISO86001 string with timezone */
    firstOccurrenceAt: z.string().min(1),
    recurrenceRule: ZRecurrenceRule,
  });

export type CreatePersonalSheetTransactionScheduleInput = z.infer<
  typeof ZCreatePersonalSheetTransactionScheduleInput
>;

export const ZBatchCreatePersonalSheetTransactionInput = z.object({
  personalSheetId: z.string().min(1),
  transactions: z.array(ZCreateSheetTransactionInput),
});

export const ZCreateGroupSheetTransactionInput =
  ZCreateSheetTransactionInput.extend({
    paidOrReceivedById: z.string().min(1),
    groupSheetId: z.string().min(1),
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
  id: z.string().min(1),
  description: z.string(),
});

export const ZCreateGroupSheetSettlementInput = z.object({
  groupSheetId: z.string().min(1),
  fromId: z.string().min(1, { message: "Sender is required" }),
  toId: z.string().min(1, { message: "Recipient is required" }),
  money: ZMoney,
});

export type CreateGroupSheetSettlementInput = z.infer<
  typeof ZCreateGroupSheetSettlementInput
>;

export const ZCreateGroupSheetSettlementResponse = z.object({
  id: z.string().min(1),
});

export const ZTransactionType = z.enum(["EXPENSE", "INCOME", "TRANSFER"]);

export type TransactionType = z.infer<typeof ZTransactionType>;

export const ZTransactionListItem = z.object({
  id: z.string().min(1),
  money: ZMoney,
  spentAt: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  type: ZTransactionType,
});

export type TransactionListItem = z.infer<typeof ZTransactionListItem>;

export const ZTransactionScheduleListItem = ZTransactionListItem.omit({
  spentAt: true,
}).extend({
  nextOccurrenceAt: z.string(),
  recurrenceRule: ZRecurrenceRule,
});

export type TransactionScheduleListItem = z.infer<
  typeof ZTransactionScheduleListItem
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

const ZTransactionParticipantType = z.enum([
  "participant",
  "transfer_from",
  "transfer_to",
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

export const ZTransactionWithSheet = z.discriminatedUnion("sheetType", [
  ZTransactionListItem.extend({
    sheetType: z.literal("PERSONAL" satisfies SheetType),
    sheet: ZSheet,
  }),
  ZGroupSheetTransactionListItem.extend({
    sheetType: z.literal("GROUP" satisfies SheetType),
    sheet: ZSheet,
  }),
]);
export type TransactionWithSheet = z.infer<typeof ZTransactionWithSheet>;

export const ZGetAllUserTransactionsInput = z.object({
  fromTimestamp: z.iso.datetime(),
  toTimestamp: z.iso.datetime(),
});
export type GetAllUserTransactionsInput = z.infer<
  typeof ZGetAllUserTransactionsInput
>;

export const ZGetAllUserTransactionsResponse = z.array(ZTransactionWithSheet);

export type GetAllUserTransactionsResponse = z.infer<
  typeof ZGetAllUserTransactionsResponse
>;

const ZParticipantBalance = ZParticipant.extend({
  balance: ZMoney,
});

export const ZTransactionSummaryResponse = z.array(ZParticipantBalance);

export type TransactionSummaryResponse = z.infer<
  typeof ZTransactionSummaryResponse
>;

export const ZBalanceSimplificationResponse = z.array(
  z.object({
    from: ZParticipant,
    to: ZParticipant,
    money: ZMoney,
  }),
);

export type BalanceSimplificationResponse = z.infer<
  typeof ZBalanceSimplificationResponse
>;
