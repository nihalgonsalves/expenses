import { z } from "zod";

import {
  ZNotificationSubscription,
  type ZNotificationSubscriptionUpsertInput,
  ZNotificationSubscriptionsResponse,
} from "@nihalgonsalves/expenses-shared/types/notification";

import { config } from "../../config.ts";
import type { ContextObj } from "../../context.ts";

type AuthenticatedContext = Pick<
  ContextObj,
  "notificationSubscriptionService" | "userAgent"
> & {
  user: NonNullable<ContextObj["user"]>;
};

export const getPublicKey = async (_ctx: AuthenticatedContext) =>
  z.string().parse(config.VAPID_PUBLIC_KEY);

export const upsertSubscription = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZNotificationSubscriptionUpsertInput>,
) => {
  const description = `${ctx.userAgent.device.model} (${ctx.userAgent.browser.name})`;

  return ZNotificationSubscription.parse(
    await ctx.notificationSubscriptionService.upsertSubscription(
      ctx.user,
      input,
      description,
    ),
  );
};

export const deleteSubscription = async (
  ctx: AuthenticatedContext,
  id: string,
) => {
  await ctx.notificationSubscriptionService.deleteSubscription(ctx.user, id);
};

export const getSubscriptions = async (ctx: AuthenticatedContext) =>
  ZNotificationSubscriptionsResponse.parse(
    await ctx.notificationSubscriptionService.getSubscriptions(ctx.user),
  );
