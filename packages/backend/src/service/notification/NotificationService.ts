import { type PrismaClient } from '@prisma/client';
import webPush from 'web-push';

import { config } from '../../config';
import { generateId } from '../../nanoid';
import { type User } from '../user/types';

import {
  type NotificationSubscriptionUpsertInput,
  type NotificationPayload,
  ZNotificationPayload,
} from './types';

const vapidDetails = {
  subject: `mailto:${config.VAPID_EMAIL}`,
  publicKey: config.VAPID_PUBLIC_KEY,
  privateKey: config.VAPID_PRIVATE_KEY,
};

export class NotificationService {
  constructor(private prismaClient: PrismaClient) {}

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
  ) {
    const subscriptions =
      await this.prismaClient.notificationSubscription.findMany({
        where: {
          userId: {
            in: Object.keys(messagesByUserId),
          },
        },
      });

    await Promise.all(
      subscriptions.map(async ({ userId, endpoint, keyAuth, keyP256dh }) => {
        try {
          await webPush.sendNotification(
            {
              endpoint,
              keys: {
                auth: keyAuth,
                p256dh: keyP256dh,
              },
            },
            // parse with zod to ensure no extra field passthrough
            JSON.stringify(
              ZNotificationPayload.parse(messagesByUserId[userId]),
            ),
            {
              vapidDetails,
            },
          );
        } catch (e) {
          console.error(
            `Error sending notification to user=${userId}, endpoint=${endpoint}`,
            e,
          );
        }
      }),
    );
  }
}
