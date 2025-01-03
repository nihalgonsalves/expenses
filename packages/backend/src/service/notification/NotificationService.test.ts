import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { makeWaitForQueueSuccess } from "../../../test/bullMQUtils";
import {
  notificationSubscriptionFactory,
  userFactory,
} from "../../../test/factories";
import { getPrisma } from "../../../test/getPrisma";
import { getRedis } from "../../../test/getRedis";
import { createPushService, getVapidDetails } from "../../../test/webPushUtils";
import { NOTIFICATION_BULLMQ_QUEUE } from "../../config";
import { closeWorker } from "../../startWorkers";

import { NotificationDispatchWorker } from "./NotificationDispatchWorker";

const prisma = await getPrisma();
const redis = await getRedis();
const notificationDispatchService = new NotificationDispatchWorker(
  prisma,
  redis,
  getVapidDetails(),
);

beforeAll(() => {
  // self-signed test certificate
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
});

afterAll(async () => {
  await closeWorker(notificationDispatchService);
  delete process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
});

const sendTestNotification = async (userId: string) =>
  notificationDispatchService.sendNotifications({
    [userId]: {
      type: "TEST",
      message: "test",
    },
  });

const waitForQueueSuccess = makeWaitForQueueSuccess(
  NOTIFICATION_BULLMQ_QUEUE,
  redis,
);

describe("NotificationService", () => {
  describe("sendNotifications", () => {
    it("sends notifications to all users", async () => {
      // since assertions are within callbacks
      expect.assertions(2);

      const user = await userFactory(prisma);

      const address = await createPushService((req, res) => {
        // don't bother reproducing the entire web push library test suite, just confirm that it was sent
        expect(req.headers).toEqual({
          authorization: expect.stringMatching(/^vapid t=.*$/),
          connection: expect.stringMatching(/^(keep-alive|close)$/),
          "content-encoding": "aes128gcm",
          "content-length": "135",
          "content-type": "application/octet-stream",
          host: expect.stringMatching(/localhost:\d+/),
          ttl: "2419200",
          urgency: "normal",
        });

        res.writeHead(201);
        res.end("okay");
      });

      const { id } = await notificationSubscriptionFactory(
        prisma,
        user,
        address,
      );

      const { returnvalue } = await waitForQueueSuccess(async () => {
        await sendTestNotification(user.id);
      });

      expect(returnvalue).toMatchObject({
        id,
        userId: user.id,
        success: true,
      });
    });

    it("unsubscribes on failure (e.g. 410 Gone)", async () => {
      const user = await userFactory(prisma);

      const address = await createPushService((_req, res) => {
        res.writeHead(410);
        res.end();
      });

      const { id } = await notificationSubscriptionFactory(
        prisma,
        user,
        address,
      );

      const { returnvalue } = await waitForQueueSuccess(async () => {
        await sendTestNotification(user.id);
      });

      expect(returnvalue).toEqual({
        id,
        userId: user.id,
        success: false,
        errorType: "SERVER",
        statusCode: 410,
      });

      expect(
        await prisma.notificationSubscription.count({ where: { id } }),
      ).toBe(0);
    });
  });
});
