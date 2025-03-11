import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import webPush, {
  WebPushError,
  type PushSubscription,
  type RequestOptions,
} from "web-push";

import {
  type NotificationPayload,
  ZNotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import type { PrismaClientType } from "../../app.ts";
import { NOTIFICATION_BULLMQ_QUEUE } from "../../config.ts";
import type { IWorker } from "../../startWorkers.ts";

type WebPushQueueItem = {
  userId: string;
  subscriptionId: string;
  pushSubscription: PushSubscription;
  payload: NotificationPayload;
};
type NotificationDispatchResult = { id: string; userId: string } & (
  | { success: false; errorType: "SERVER"; statusCode: number }
  | { success: false; errorType: "UNKNOWN"; error: unknown }
  | { success: true }
);

export type INotificationDispatchWorker = {
  sendNotifications: (
    messagesByUserId: Record<string, NotificationPayload>,
  ) => Promise<void>;
};

export class NotificationDispatchWorker
  implements
    INotificationDispatchWorker,
    IWorker<WebPushQueueItem, NotificationDispatchResult>
{
  queue: Queue<WebPushQueueItem, NotificationDispatchResult>;

  worker: Worker<WebPushQueueItem, NotificationDispatchResult>;

  private prismaClient: PrismaClientType;
  private vapidDetails: NonNullable<RequestOptions["vapidDetails"]>;

  constructor(
    prismaClient: PrismaClientType,
    redis: Redis,
    vapidDetails: NonNullable<RequestOptions["vapidDetails"]>,
  ) {
    this.prismaClient = prismaClient;
    this.vapidDetails = vapidDetails;

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
        name: "push-message",
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
          errorType: "SERVER",
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
          errorType: "UNKNOWN",
          error,
        };
      }
    }
  }
}
