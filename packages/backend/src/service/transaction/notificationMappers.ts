import type { Transaction } from "@prisma/client";

import type { Money } from "@nihalgonsalves/expenses-shared/money";
import type { NotificationPayload } from "@nihalgonsalves/expenses-shared/types/notification";
import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";

export const transactionToNotificationPayload = (
  transaction: Omit<Transaction, "type"> & { type: "INCOME" | "EXPENSE" },
  groupSheet: Sheet,
  yourShare: Omit<Money, "currencyCode">,
): NotificationPayload => ({
  type: transaction.type,
  groupSheet,
  transaction: {
    ...transaction,
    money: {
      currencyCode: groupSheet.currencyCode,
      amount: transaction.amount,
      scale: transaction.scale,
    },
    yourShare: {
      ...yourShare,
      currencyCode: groupSheet.currencyCode,
    },
  },
});

export const transferToNotificationPayload = (
  transaction: Omit<Transaction, "type"> & { type: "TRANSFER" },
  groupSheet: Sheet,
  transferType: "sent" | "received",
): NotificationPayload => ({
  type: transaction.type,
  groupSheet,
  transaction: {
    ...transaction,
    type: transferType,
    money: {
      currencyCode: groupSheet.currencyCode,
      amount: transaction.amount,
      scale: transaction.scale,
    },
  },
});
