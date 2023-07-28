import { type PrismaClient } from '@prisma/client';
import { WebPushError } from 'web-push';

import { generateId } from '../../nanoid';
import { type User } from '../user/types';

import { type IWebPushService, WebPushService } from './WebPushService';
import {
  type NotificationSubscriptionUpsertInput,
  type NotificationPayload,
  ZNotificationPayload,
} from './types';

type NotificationDispatchResult = { id: string; userId: string } & (
  | { success: true }
  | { success: false; errorType: 'SERVER'; statusCode: number }
  | { success: false; errorType: 'UNKNOWN'; error: unknown }
);

export class NotificationService {
  constructor(
    private prismaClient: PrismaClient,
    private webPushService: IWebPushService<NotificationPayload> = new WebPushService(),
  ) {}

  async getSubscriptions(user: User) {
    return this.prismaClient.notificationSubscription.findMany({
      where: {
        userId: user.id,
      },
    });
  }

  async upsertSubscription(
    user: User,
    input: NotificationSubscriptionUpsertInput,
    description: string,
  ) {
    const createOrUpdate = {
      userId: user.id,
      description,

      endpoint: input.pushSubscription.endpoint,
      keyAuth: input.pushSubscription.keys.auth,
      keyP256dh: input.pushSubscription.keys.p256dh,
    };

    return this.prismaClient.notificationSubscription.upsert({
      where: {
        endpoint: input.pushSubscription.endpoint,
      },
      create: { ...createOrUpdate, id: generateId() },
      update: createOrUpdate,
    });
  }

  async deleteSubscription(user: User, id: string) {
    await this.prismaClient.notificationSubscription.delete({
      where: {
        id,
        userId: user.id,
      },
    });
  }

  async sendNotifications(
    messagesByUserId: Record<string, NotificationPayload>,
  ): Promise<NotificationDispatchResult[]> {
    const subscriptions =
      await this.prismaClient.notificationSubscription.findMany({
        where: {
          userId: {
            in: Object.keys(messagesByUserId),
          },
        },
      });

    const results = await Promise.all(
      subscriptions.map(
        async ({
          id,
          userId,
          endpoint,
          keyAuth,
          keyP256dh,
        }): Promise<NotificationDispatchResult> => {
          try {
            await this.webPushService.sendNotification(
              {
                endpoint,
                keys: {
                  auth: keyAuth,
                  p256dh: keyP256dh,
                },
              },
              // parse with zod to ensure no extra field passthrough
              ZNotificationPayload.parse(messagesByUserId[userId]),
            );

            return { id, userId, success: true };
          } catch (error) {
            if (error instanceof WebPushError) {
              console.error(
                `Error sending notification to user=${userId}, endpoint=${endpoint}, statusCode=${error.statusCode}`,
              );
              return {
                id,
                userId,
                success: false,
                errorType: 'SERVER',
                statusCode: error.statusCode,
              };
            }

            console.error(
              `Error sending notification to user=${userId}, endpoint=${endpoint}`,
              error,
            );
            return { id, userId, success: false, errorType: 'UNKNOWN', error };
          }
        },
      ),
    );

    const idsToUnsubscribe = results
      .filter(
        (r) =>
          !r.success &&
          r.errorType === 'SERVER' &&
          [400, 404, 410].includes(r.statusCode),
      )
      .map(({ id }) => id);

    await this.prismaClient.notificationSubscription.deleteMany({
      where: { id: { in: idsToUnsubscribe } },
    });

    return results;
  }
}
