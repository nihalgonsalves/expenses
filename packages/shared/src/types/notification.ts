import { z } from "zod";

import { ZMoney } from "./transaction.ts";

const ZNotificationTransaction = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  description: z.string(),
  money: ZMoney,
});

const ZExpenseNotificationPayload = z.object({
  type: z.literal("EXPENSE"),
  groupSheet: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  transaction: ZNotificationTransaction.extend({
    yourShare: ZMoney,
  }),
});

const ZIncomeNotificationPayload = z.object({
  type: z.literal("INCOME"),
  groupSheet: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  transaction: ZNotificationTransaction.extend({
    yourShare: ZMoney,
  }),
});

const ZTransferNotificationPayload = z.object({
  type: z.literal("TRANSFER"),
  groupSheet: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  transaction: ZNotificationTransaction.extend({
    type: z.enum(["sent", "received"]),
  }),
});

const ZTestNotificationPayload = z.object({
  type: z.literal("TEST"),
  message: z.string().min(1),
});

export const ZNotificationPayload = z.union([
  ZTestNotificationPayload,
  ZExpenseNotificationPayload,
  ZIncomeNotificationPayload,
  ZTransferNotificationPayload,
]);

export type NotificationPayload = z.infer<typeof ZNotificationPayload>;

export const ZPushSubscription = z.object({
  endpoint: z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
  keys: z.object({
    auth: z.string().min(1),
    p256dh: z.string().min(1),
  }),
});

export const ZNotificationSubscriptionUpsertInput = z.object({
  pushSubscription: ZPushSubscription,
});

export const ZNotificationSubscription = z.object({
  id: z.string(),
  description: z.string(),
  endpoint: z.string(),
});

export const ZNotificationSubscriptionsResponse = z.array(
  ZNotificationSubscription,
);

export type NotificationSubscriptionUpsertInput = z.infer<
  typeof ZNotificationSubscriptionUpsertInput
>;
