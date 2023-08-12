import { describe, expect, it } from 'vitest';

import {
  groupSheetFactory,
  notificationSubscriptionFactory,
  userFactory,
} from '../../../test/factories';
import { getPrisma } from '../../../test/getPrisma';
import { createGroupSheetTransactionInput } from '../../../test/input';
import {
  FakeNotificationDispatchService,
  type FakeNotificationItem,
} from '../../../test/webPushUtils';

import { TransactionService } from './service';

const prisma = await getPrisma();

const currencyCode = 'EUR';

const subscribedUser = async () => {
  const user = await userFactory(prisma);
  await notificationSubscriptionFactory(prisma, user);
  return user;
};

const useSetup = async () => {
  const notificationDispatchService = new FakeNotificationDispatchService();
  const transactionService = new TransactionService(
    prisma,
    notificationDispatchService,
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

  return {
    notificationDispatchService,
    transactionService,
    user1,
    user2,
    user3,
    groupSheet,
  };
};

describe('TransactionService', () => {
  describe('createGroupSheetExpense', () => {
    it('sends a notification to all expense participants except the creator', async () => {
      const {
        notificationDispatchService: webPushService,
        transactionService,
        groupSheet,
        user1: creator,
        user2: otherParticipant,
        // user3 ignored, but important because it tests that the notification is not sent to them
      } = await useSetup();

      const input = createGroupSheetTransactionInput(
        'EXPENSE',
        groupSheet.id,
        currencyCode,
        creator.id,
        otherParticipant.id,
      );

      const { id } = await transactionService.createGroupSheetTransaction(
        creator,
        input,
        groupSheet,
      );

      expect(webPushService.messages).toEqual<FakeNotificationItem[]>([
        {
          userId: otherParticipant.id,
          payload: {
            type: 'EXPENSE',
            transaction: {
              id,
              category: 'other',
              description: 'test group expense',
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
        notificationDispatchService,
        transactionService,
        groupSheet,
        user1: fromUser,
        user2: toUser,
      } = await useSetup();

      const { id } = await transactionService.createSettlement(
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

      expect(notificationDispatchService.messages).toEqual<
        FakeNotificationItem[]
      >([
        {
          userId: toUser.id,
          payload: {
            type: 'TRANSFER',
            transaction: {
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
        notificationDispatchService: webPushService,
        transactionService,
        groupSheet,
        user1: fromUser,
        user2: toUser,
      } = await useSetup();

      const { id } = await transactionService.createSettlement(
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

      expect(webPushService.messages).toEqual<FakeNotificationItem[]>([
        {
          userId: fromUser.id,
          payload: {
            type: 'TRANSFER',
            transaction: {
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
