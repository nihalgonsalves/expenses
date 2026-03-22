import { z } from "zod/mini";

const ZCurrencyCode = z.string().check(z.length(3));

// NOTE: duplicated from '../money.ts' because this is used in the size-limited
// service worker and we want to use zod/mini here.
const ZMoney = z.object({
  amount: z.int(),
  scale: z.int().check(z.nonnegative()),
  currencyCode: ZCurrencyCode,
});

const ZNotificationTransaction = z.object({
  id: z.string().check(z.minLength(1)),
  category: z.string().check(z.minLength(1)),
  description: z.string(),
  money: ZMoney,
});

const ZExpenseNotificationPayload = z.object({
  type: z.literal("EXPENSE"),
  action: z._default(
    z.optional(z.enum(["created", "updated", "deleted"])),
    "created",
  ),
  groupSheet: z.object({
    id: z.string().check(z.minLength(1)),
    name: z.string().check(z.minLength(1)),
  }),
  transaction: z.extend(ZNotificationTransaction, {
    yourShare: ZMoney,
  }),
});

const ZIncomeNotificationPayload = z.object({
  type: z.literal("INCOME"),
  action: z._default(
    z.optional(z.enum(["created", "updated", "deleted"])),
    "created",
  ),
  groupSheet: z.object({
    id: z.string().check(z.minLength(1)),
    name: z.string().check(z.minLength(1)),
  }),
  transaction: z.extend(ZNotificationTransaction, {
    yourShare: ZMoney,
  }),
});

const ZTransferNotificationPayload = z.object({
  type: z.literal("TRANSFER"),
  groupSheet: z.object({
    id: z.string().check(z.minLength(1)),
    name: z.string().check(z.minLength(1)),
  }),
  transaction: z.extend(ZNotificationTransaction, {
    type: z.enum(["sent", "received"]),
  }),
});

const ZTestNotificationPayload = z.object({
  type: z.literal("TEST"),
  message: z.string().check(z.minLength(1)),
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
    auth: z.string().check(z.minLength(1)),
    p256dh: z.string().check(z.minLength(1)),
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
