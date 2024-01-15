import crypto from "crypto";
import type { ServerResponse, IncomingMessage } from "http";
import { createServer } from "https";

import { type CertificateCreationResult, createCertificate } from "pem";
import { generateVAPIDKeys } from "web-push";

import {
  ZNotificationPayload,
  type NotificationPayload,
} from "@nihalgonsalves/expenses-shared/types/notification";

import type { INotificationDispatchWorker } from "../src/service/notification/NotificationDispatchWorker";

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
export class FakeNotificationDispatchService
  implements INotificationDispatchWorker
{
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

const { clientKey, certificate } = await new Promise<CertificateCreationResult>(
  (resolve, reject) => {
    createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
      if (err != null) {
        reject(
          err instanceof Error
            ? err
            : new Error("Error creating certificate", { cause: err }),
        );
      } else {
        resolve(keys);
      }
    });
  },
);

export const createPushService = async (
  onReceive: (req: IncomingMessage, res: ServerResponse) => void,
) =>
  new Promise<string>((resolve, reject) => {
    const server = createServer(
      { key: clientKey, cert: certificate },
      (req, res) => {
        onReceive(req, res);
      },
    );

    server.listen(undefined, () => {
      const addr = server.address();
      if (addr == null || typeof addr === "string") {
        reject(new Error("Unexpected server address"));
      } else {
        resolve(`https://localhost:${addr.port}/`);
      }
    });
  });
