import type { PrismaClient } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import webPush, {
  WebPushError,
  type PushSubscription,
  type RequestOptions,
} from 'web-push';

import {
  type NotificationSubscriptionUpsertInput,
  type NotificationPayload,
  ZNotificationPayload,
} from '@nihalgonsalves/expenses-shared/types/notification';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { NOTIFICATION_BULLMQ_QUEUE } from '../../config';
import { generateId } from '../../utils/nanoid';

export class NotificationSubscriptionService {
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
}

type WebPushQueueItem = {
  userId: string;
  subscriptionId: string;
  pushSubscription: PushSubscription;
  payload: NotificationPayload;
};

type NotificationDispatchResult = { id: string; userId: string } & (
  | { success: false; errorType: 'SERVER'; statusCode: number }
  | { success: false; errorType: 'UNKNOWN'; error: unknown }
  | { success: true }
);

export type INotificationDispatchService = {
  sendNotifications: (
    messagesByUserId: Record<string, NotificationPayload>,
  ) => Promise<void>;
};

export class NotificationDispatchService
  implements INotificationDispatchService
{
  private queue: Queue<WebPushQueueItem, NotificationDispatchResult>;

  private worker: Worker<WebPushQueueItem, NotificationDispatchResult>;

  constructor(
    private prismaClient: PrismaClient,
    redis: IORedis,
    private vapidDetails: NonNullable<RequestOptions['vapidDetails']>,
  ) {
    this.queue = new Queue(NOTIFICATION_BULLMQ_QUEUE, {
      connection: redis,
    });

    this.worker = new Worker(
      NOTIFICATION_BULLMQ_QUEUE,
      async (job) => this.process(job.data),
      {
        connection: redis,
      },
    );

    process.on('SIGINT', () => {
      void this.worker.close();
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

    await this.queue.addBulk(
      subscriptions.map(({ id, userId, endpoint, keyAuth, keyP256dh }) => ({
        name: 'push-message',
        data: {
          userId,
          subscriptionId: id,
          pushSubscription: {
            endpoint,
            keys: {
              auth: keyAuth,
              p256dh: keyP256dh,
            },
          },
          payload: ZNotificationPayload.parse(messagesByUserId[userId]),
        },
      })),
    );
  }

  private async process({
    subscriptionId,
    userId,
    pushSubscription,
    payload,
  }: WebPushQueueItem): Promise<NotificationDispatchResult> {
    const baseResult = { id: subscriptionId, userId };

    try {
      await webPush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          vapidDetails: this.vapidDetails,
        },
      );

      return { ...baseResult, success: true };
    } catch (error) {
      if (error instanceof WebPushError) {
        console.error(
          `Error sending notification to user=${userId}, endpoint=${pushSubscription.endpoint}, statusCode=${error.statusCode}`,
        );

        if ([400, 404, 410].includes(error.statusCode)) {
          await this.prismaClient.notificationSubscription.deleteMany({
            where: { id: subscriptionId },
          });
        }

        return {
          ...baseResult,
          success: false,
          errorType: 'SERVER',
          statusCode: error.statusCode,
        };
      } else {
        console.error(
          `Error sending notification to user=${userId}, endpoint=${pushSubscription.endpoint}`,
          error,
        );

        return {
          ...baseResult,
          success: false,
          errorType: 'UNKNOWN',
          error,
        };
      }
    }
  }
}
