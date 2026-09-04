import { Queue, Worker, type PostgresQueueBackend } from "bullmq";
import type { Pool } from "pg";
import webPush, {
  WebPushError,
  type PushSubscription,
  type RequestOptions,
} from "web-push";

import {
  type NotificationPayload,
  ZNotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import { NOTIFICATION_BULLMQ_QUEUE } from "../../config.ts";
import type { PrismaClientType } from "../../create-prisma.ts";
import type { IWorker } from "../../start-workers.ts";
import { createPostgresBackend } from "../../postgres.ts";

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

export class NotificationDispatchQueue implements INotificationDispatchWorker {
  queue: Queue<
    WebPushQueueItem,
    NotificationDispatchResult,
    string,
    WebPushQueueItem,
    NotificationDispatchResult,
    string,
    PostgresQueueBackend
  >;

  private prismaClient: PrismaClientType;
  private vapidDetails: NonNullable<RequestOptions["vapidDetails"]>;

  constructor(
    prismaClient: PrismaClientType,
    pool: Pool,
    vapidDetails: NonNullable<RequestOptions["vapidDetails"]>,
  ) {
    this.prismaClient = prismaClient;
    this.vapidDetails = vapidDetails;

    this.queue = new Queue(
      NOTIFICATION_BULLMQ_QUEUE,
      { connection: pool },
      createPostgresBackend,
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

  protected async process({
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

export class NotificationDispatchWorker
  extends NotificationDispatchQueue
  implements IWorker<WebPushQueueItem, NotificationDispatchResult>
{
  worker: Worker<
    WebPushQueueItem,
    NotificationDispatchResult,
    string,
    PostgresQueueBackend
  >;

  constructor(
    prismaClient: PrismaClientType,
    pool: Pool,
    vapidDetails: NonNullable<RequestOptions["vapidDetails"]>,
  ) {
    super(prismaClient, pool, vapidDetails);
    this.worker = new Worker(
      NOTIFICATION_BULLMQ_QUEUE,
      async (job) => this.process(job.data),
      { connection: pool },
      createPostgresBackend,
    );
  }
}
