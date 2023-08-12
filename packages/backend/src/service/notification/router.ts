import { z } from 'zod';

import {
  ZNotificationSubscription,
  ZNotificationSubscriptionUpsertInput,
  ZNotificationSubscriptionsResponse,
} from '@nihalgonsalves/expenses-shared/types/notification';

import { config } from '../../config';
import { protectedProcedure, router } from '../../trpc';

export const notificationRouter = router({
  getPublicKey: protectedProcedure
    .output(z.string())
    .query(() => config.VAPID_PUBLIC_KEY),

  upsertSubscription: protectedProcedure
    .input(ZNotificationSubscriptionUpsertInput)
    .output(ZNotificationSubscription)
    .mutation(async ({ ctx, input }) => {
      const description = `${ctx.userAgent.device.model} (${ctx.userAgent.browser.name})`;

      return ctx.notificationSubscriptionService.upsertSubscription(
        ctx.user,
        input,
        description,
      );
    }),

  deleteSubscription: protectedProcedure
    .input(z.string())
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.notificationSubscriptionService.deleteSubscription(
        ctx.user,
        input,
      );
    }),

  getSubscriptions: protectedProcedure
    .output(ZNotificationSubscriptionsResponse)
    .query(async ({ ctx }) =>
      ctx.notificationSubscriptionService.getSubscriptions(ctx.user),
    ),
});
