import { ExpenseType } from '@prisma/client';
import { z } from 'zod';

import { ZMoney } from '../expense/types';

const ZExpenseNotificationPayload = z.object({
  type: z.literal('expense'),
  groupSheet: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
  expense: z.object({
    id: z.string().nonempty(),
    category: z.string().nonempty(),
    description: z.string(),
    type: z.nativeEnum(ExpenseType),
    money: ZMoney,
    yourBalance: ZMoney,
  }),
});

const ZTestNotificationPayload = z.object({
  type: z.literal('test'),
  message: z.string().nonempty(),
});

export const ZNotificationPayload = z.union([
  ZTestNotificationPayload,
  ZExpenseNotificationPayload,
]);

export type NotificationPayload = z.infer<typeof ZNotificationPayload>;

const ZPushSubscription = z.object({
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
