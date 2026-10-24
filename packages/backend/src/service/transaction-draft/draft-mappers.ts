import type { NotificationPayload } from "@nihalgonsalves/expenses-shared/types/notification";

import type { TransactionDraft } from "../../prisma/client.ts";

/** `null` if the amount couldn't be parsed */
export const toDraftMoney = ({
  amount,
  scale,
  currencyCode,
}: Pick<TransactionDraft, "amount" | "scale" | "currencyCode">) =>
  amount === null || scale === null ? null : { amount, scale, currencyCode };

export const draftToNotificationPayload = (
  draft: TransactionDraft,
): NotificationPayload => ({
  type: "DRAFT",
  draft: {
    id: draft.id,
    description: draft.description,
    money: toDraftMoney(draft),
  },
});
