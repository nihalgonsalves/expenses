import { z } from 'zod';

import { config } from '../config';
import {
  ZNotificationSubscription,
  ZNotificationSubscriptionUpsertInput,
  ZNotificationSubscriptionsResponse,
} from '../service/notification/types';
import { protectedProcedure, router } from '../trpc';

export const notificationRouter = router({
  getPublicKey: protectedProcedure
    .output(z.string())
    .query(() => config.VAPID_PUBLIC_KEY),

  upsertSubscription: protectedProcedure
    .input(ZNotificationSubscriptionUpsertInput)
    .output(ZNotificationSubscription)
    .mutation(async ({ ctx, input }) => {
      const description = `${ctx.userAgent.device.model} (${ctx.userAgent.browser.name})`;

      return ctx.notificationService.upsertSubscription(
        ctx.user,
        input,
        description,
      );
    }),

  deleteSubscription: protectedProcedure
    .input(z.string())
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.notificationService.deleteSubscription(ctx.user, input);
    }),

  getSubscriptions: protectedProcedure
    .output(ZNotificationSubscriptionsResponse)
    .query(({ ctx }) => ctx.notificationService.getSubscriptions(ctx.user)),
});
