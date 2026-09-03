import crypto from "crypto";
import { generateVAPIDKeys } from "web-push";

import {
  ZNotificationPayload,
  type NotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import type { INotificationDispatchWorker } from "../src/service/notification/notification-dispatch-worker.ts";

export const getVapidDetails = () => {
  const { publicKey, privateKey } = generateVAPIDKeys();

  return {
    publicKey,
    privateKey,
    subject: `mailto:nobody@example.com`,
  };
};

export type FakeNotificationItem = {
  userId: string;
  payload: NotificationPayload;
};
export class FakeNotificationDispatchService implements INotificationDispatchWorker {
  public messages: FakeNotificationItem[] = [];

  async sendNotifications(
    messagesByUserId: Record<string, NotificationPayload>,
  ) {
    this.messages.push(
      ...Object.entries(messagesByUserId).map(([userId, payload]) => ({
        userId,
        payload: ZNotificationPayload.parse(payload),
      })),
    );
  }
}

export const getUserKeys = () => {
  const userCurve = crypto.createECDH("prime256v1");
  const userPublicKey = userCurve.generateKeys();
  const userAuth = crypto.randomBytes(16);

  return {
    p256dh: userPublicKey.toString("base64url"),
    auth: userAuth.toString("base64url"),
  };
};
