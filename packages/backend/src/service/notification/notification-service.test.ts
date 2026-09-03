import { afterAll, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";

import { makeWaitForQueueSuccess } from "../../../test/bull-mq-utils.ts";
import {
  notificationSubscriptionFactory,
  userFactory,
} from "../../../test/factories.ts";
import { FakeEmailWorker } from "../../../test/fake-email-worker.ts";
import { getPrisma } from "../../../test/get-prisma.ts";
import { getRedis } from "../../../test/get-redis.ts";
import { setupMockServer } from "../../../test/msw.ts";
import { getVapidDetails } from "../../../test/web-push-utils.ts";
import { NOTIFICATION_BULLMQ_QUEUE } from "../../config.ts";
import { closeWorker } from "../../start-workers.ts";
import { createAuth } from "../../utils/auth.ts";

import { NotificationDispatchWorker } from "./notification-dispatch-worker.ts";

const prisma = await getPrisma();
const betterAuth = createAuth(prisma, new FakeEmailWorker());
const redis = await getRedis();
const notificationDispatchService = new NotificationDispatchWorker(
  prisma,
  redis,
  getVapidDetails(),
);
const mockServer = setupMockServer();

afterAll(async () => {
  await closeWorker(notificationDispatchService);
});

const pushEndpoint = "https://push.example.test/subscription";

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
      expect.assertions(3);

      const { user } = await userFactory(prisma, betterAuth);

      mockServer.use(
        http.post(pushEndpoint, ({ request }) => {
          // don't bother reproducing the entire web push library test suite, just confirm that it was sent
          expect(request.method).toBe("POST");
          expect(Object.fromEntries(request.headers)).toEqual(
            expect.objectContaining({
              authorization: expect.stringMatching(/^vapid t=.*$/),
              "content-encoding": "aes128gcm",
              "content-type": "application/octet-stream",
              ttl: "2419200",
              urgency: "normal",
            }),
          );

          return new HttpResponse(null, { status: 201 });
        }),
      );

      const { id } = await notificationSubscriptionFactory(
        prisma,
        user,
        pushEndpoint,
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
      const { user } = await userFactory(prisma, betterAuth);

      mockServer.use(
        http.post(pushEndpoint, () => new HttpResponse(null, { status: 410 })),
      );

      const { id } = await notificationSubscriptionFactory(
        prisma,
        user,
        pushEndpoint,
      );

      const { returnvalue } = await waitForQueueSuccess(async () => {
        await sendTestNotification(user.id);
      });

      expect(returnvalue).toStrictEqual({
        id,
        userId: user.id,
        success: false,
        errorType: "SERVER",
        statusCode: 410,
      });

      await expect(
        prisma.notificationSubscription.count({ where: { id } }),
      ).resolves.toBe(0);
    });
  });
});
