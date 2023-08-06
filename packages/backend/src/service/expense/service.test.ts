import { describe, expect, it } from 'vitest';

import type { NotificationPayload } from '../..';
import {
  groupSheetFactory,
  notificationSubscriptionFactory,
  userFactory,
} from '../../../test/factories';
import { getPrisma } from '../../../test/getPrisma';
import { createGroupSheetExpenseInput } from '../../../test/input';
import { FakeWebPushService } from '../../../test/webPushUtils';
import { NotificationService } from '../notification/service';

import { ExpenseService } from './service';

const prisma = await getPrisma();

const currencyCode = 'EUR';

const subscribedUser = async () => {
  const user = await userFactory(prisma);
  await notificationSubscriptionFactory(prisma, user);
  return user;
};

const useSetup = async () => {
  const webPushService = new FakeWebPushService<NotificationPayload>();
  const expenseService = new ExpenseService(
    prisma,
    new NotificationService(prisma, webPushService),
  );

  const [user1, user2, user3] = await Promise.all([
    subscribedUser(),
    subscribedUser(),
    subscribedUser(),
  ]);

  const groupSheet = await groupSheetFactory(prisma, {
    withParticipantIds: [user1.id, user2.id, user3.id],
    currencyCode,
  });

  return { webPushService, expenseService, user1, user2, user3, groupSheet };
};

describe('ExpenseService', () => {
  describe('createGroupSheetExpense', () => {
    it('sends a notification to all expense participants except the creator', async () => {
      const {
        webPushService,
        expenseService,
        groupSheet,
        user1: creator,
        user2: otherParticipant,
        // user3 ignored, but important because it tests that the notification is not sent to them
      } = await useSetup();

      const input = createGroupSheetExpenseInput(
        'EXPENSE',
        groupSheet.id,
        currencyCode,
        creator.id,
        otherParticipant.id,
      );

      const { id } = await expenseService.createGroupSheetExpenseOrIncome(
        creator,
        input,
        groupSheet,
      );

      expect(webPushService.messages).toEqual([
        {
          endpoint: `https://push.example.com/user/${otherParticipant.id}`,
          payload: {
            type: 'EXPENSE',
            expense: {
              id,
              category: 'other',
              description: 'Test expense',
              money: {
                currencyCode: groupSheet.currencyCode,
                amount: 100_00,
                scale: 2,
              },
              yourShare: {
                currencyCode: groupSheet.currencyCode,
                amount: -75_00,
                scale: 2,
              },
            },
            groupSheet: {
              id: groupSheet.id,
              name: groupSheet.name,
            },
          },
        },
      ]);
    });
  });

  describe('createSettlement', () => {
    it('sends a notification to the receiver when created by the sender', async () => {
      const {
        webPushService,
        expenseService,
        groupSheet,
        user1: fromUser,
        user2: toUser,
      } = await useSetup();

      const { id } = await expenseService.createSettlement(
        fromUser,
        {
          money: {
            amount: 100_00,
            scale: 2,
            currencyCode: groupSheet.currencyCode,
          },
          fromId: fromUser.id,
          toId: toUser.id,
        },
        groupSheet,
      );

      expect(webPushService.messages).toEqual([
        {
          endpoint: `https://push.example.com/user/${toUser.id}`,
          payload: {
            type: 'TRANSFER',
            expense: {
              id: id,
              type: 'received',
              category: 'transfer',
              description: '',
              money: {
                currencyCode: groupSheet.currencyCode,
                amount: 100_00,
                scale: 2,
              },
            },
            groupSheet: {
              id: groupSheet.id,
              name: groupSheet.name,
            },
          },
        },
      ]);
    });

    it('sends a notification to the sender when created by the receiver', async () => {
      const {
        webPushService,
        expenseService,
        groupSheet,
        user1: fromUser,
        user2: toUser,
      } = await useSetup();

      const { id } = await expenseService.createSettlement(
        toUser,
        {
          money: {
            amount: 100_00,
            scale: 2,
            currencyCode: groupSheet.currencyCode,
          },
          fromId: fromUser.id,
          toId: toUser.id,
        },
        groupSheet,
      );

      expect(webPushService.messages).toEqual([
        {
          endpoint: `https://push.example.com/user/${fromUser.id}`,
          payload: {
            type: 'TRANSFER',
            expense: {
              id: id,
              type: 'sent',
              category: 'transfer',
              description: '',
              money: {
                currencyCode: groupSheet.currencyCode,
                amount: 100_00,
                scale: 2,
              },
            },
            groupSheet: {
              id: groupSheet.id,
              name: groupSheet.name,
            },
          },
        },
      ]);
    });
  });
});
