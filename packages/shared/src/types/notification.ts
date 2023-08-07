import { z } from 'zod';

import { ZMoney } from './expense';

const ZNotificationExpense = z.object({
  id: z.string().nonempty(),
  category: z.string().nonempty(),
  description: z.string(),
  money: ZMoney,
});

const ZExpenseNotificationPayload = z.object({
  type: z.literal('EXPENSE'),
  groupSheet: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
  expense: ZNotificationExpense.extend({
    yourShare: ZMoney,
  }),
});

const ZIncomeNotificationPayload = z.object({
  type: z.literal('INCOME'),
  groupSheet: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
  expense: ZNotificationExpense.extend({
    yourShare: ZMoney,
  }),
});

const ZTransferNotificationPayload = z.object({
  type: z.literal('TRANSFER'),
  groupSheet: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
  expense: ZNotificationExpense.extend({
    type: z.union([z.literal('sent'), z.literal('received')]),
  }),
});

const ZTestNotificationPayload = z.object({
  type: z.literal('TEST'),
  message: z.string().nonempty(),
});

export const ZNotificationPayload = z.union([
  ZTestNotificationPayload,
  ZExpenseNotificationPayload,
  ZIncomeNotificationPayload,
  ZTransferNotificationPayload,
]);

export type NotificationPayload = z.infer<typeof ZNotificationPayload>;

export const ZPushSubscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().nonempty(),
    p256dh: z.string().nonempty(),
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
