import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { userFactory } from '../../../test/factories';
import { getPrisma } from '../../../test/getPrisma';
import {
  createPushService,
  getUserKeys,
  getVapidKeys,
} from '../../../test/webPushUtils';
import { type User } from '../user/types';

import { NotificationService } from './NotificationService';

const { publicKey, privateKey } = getVapidKeys();
const prisma = await getPrisma();
const notificationService = new NotificationService(
  prisma,
  publicKey,
  privateKey,
);

beforeAll(() => {
  // self-signed test certificate
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
});

const upsertSubscription = (user: User, endpoint: string) =>
  notificationService.upsertSubscription(
    user,
    {
      pushSubscription: {
        endpoint,
        keys: getUserKeys(),
      },
    },
    'Test',
  );

const sendTestNotification = (userId: string) =>
  notificationService.sendNotifications({
    [userId]: {
      type: 'test',
      message: 'test',
    },
  });

describe('NotificationService', () => {
  describe('sendNotifications', () => {
    it('sends notifications to all users', async () => {
      // since assertions are within callbacks
      expect.assertions(2);

      const user = await userFactory(prisma);

      const address = await createPushService((req, res) => {
        // don't bother reproducing the entire web push library test suite, just confirm that it was sent
        expect(req.headers).toEqual({
          authorization: expect.stringMatching(/^vapid t=.*$/),
          connection: 'keep-alive',
          'content-encoding': 'aes128gcm',
          'content-length': '135',
          'content-type': 'application/octet-stream',
          host: expect.stringMatching(/localhost:\d+/),
          ttl: '2419200',
          urgency: 'normal',
        });

        res.writeHead(201);
        res.end('okay');
      });

      const { id } = await upsertSubscription(user, address);
      const notificationSendResult = await sendTestNotification(user.id);

      expect(notificationSendResult).toEqual([
        { id, userId: user.id, success: true },
      ]);
    });

    it('unsubscribes on failure (e.g. 410 Gone)', async () => {
      const user = await userFactory(prisma);

      const address = await createPushService((_req, res) => {
        res.writeHead(410);
        res.end();
      });

      const { id } = await upsertSubscription(user, address);
      const notificationSendResult = await sendTestNotification(user.id);

      expect(notificationSendResult).toEqual([
        {
          id,
          userId: user.id,
          success: false,
          errorType: 'SERVER',
          statusCode: 410,
        },
      ]);

      expect(
        await prisma.notificationSubscription.count({ where: { id } }),
      ).toBe(0);
    });
  });
});
