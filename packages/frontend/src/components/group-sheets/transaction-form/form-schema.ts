import { z } from "zod";
import type { Money } from "@nihalgonsalves/expenses-shared/money";
import { ZCreateGroupSheetTransactionInput } from "@nihalgonsalves/expenses-shared/types/transaction";

export const ZRatio = z.object({
  participantId: z.string().min(1),
  ratio: z.coerce.number().nonnegative(),
});

export type Ratio = z.infer<typeof ZRatio>;

export type GroupTransactionShare = {
  participantId: string;
  share: Money;
};

export const GroupTransactionSplitType = {
  Evenly: "evenly",
  Shares: "shares",
  Percentage: "percentage",
  Amounts: "amounts",
} as const;

export type GroupTransactionSplitType =
  (typeof GroupTransactionSplitType)[keyof typeof GroupTransactionSplitType];

export const formSchema = ZCreateGroupSheetTransactionInput.omit({
  money: true,
  groupSheetId: true,
  splits: true,
}).extend({
  // can be blank when the user clears out the search box
  currencyCode: z
    .string("Currency is required")
    .min(1, "Currency is required")
    .optional(),
  amount: z.number().positive({ message: "Amount is required" }),
  splitType: z.enum(GroupTransactionSplitType),
  ratios: z.array(ZRatio),
});
