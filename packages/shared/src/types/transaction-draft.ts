import { z } from "zod";

const ZShortcutText = z.string().trim().max(256);

// Fields from the Shortcuts "Wallet" automation trigger,
// sent as a JSON body from "Get Contents of URL"
export const ZCreateAppleWalletDraftInput = z.strictObject({
  /** formatted text, e.g. "12,34 €" */
  amount: z.union([ZShortcutText.min(1), z.number().transform(String)]),
  merchant: ZShortcutText.optional(),
  transaction: ZShortcutText.optional(),
  card: ZShortcutText.optional(),
  name: ZShortcutText.optional(),
});

export type CreateAppleWalletDraftInput = z.output<
  typeof ZCreateAppleWalletDraftInput
>;

export const ZTransactionDraft = z.object({
  id: z.string(),
  source: z.enum(["APPLE_WALLET"]),
  description: z.string().nullable(),
  money: z
    .object({
      amount: z.number().int(),
      scale: z.number().int().nonnegative(),
      currencyCode: z.string().nullable(),
    })
    .nullable(),
  spentAt: z.iso.datetime(),
  rawInput: z.json(),
});

export type TransactionDraft = z.infer<typeof ZTransactionDraft>;
