import { Temporal } from '@js-temporal/polyfill';
import {
  type PrismaClient,
  type Prisma,
  TransactionType,
  type TransactionEntry,
  type User as PrismaUser,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import {
  type Money,
  sumMoney,
  zeroMoney,
  negateMoney,
  equalMoney,
} from '@nihalgonsalves/expenses-shared/money';
import type { NotificationPayload } from '@nihalgonsalves/expenses-shared/types/notification';
import type {
  GroupSheetWithParticipants,
  Sheet,
} from '@nihalgonsalves/expenses-shared/types/sheet';
import type {
  TransactionSummaryResponse,
  CreateGroupSheetTransactionInput,
  CreateGroupSheetSettlementInput,
  CreatePersonalSheetTransactionInput,
  GroupSheetParticipantItem,
  CreatePersonalSheetTransactionScheduleInput,
  UpdatePersonalSheetTransactionInput,
} from '@nihalgonsalves/expenses-shared/types/transaction';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { generateId } from '../../utils/nanoid';
import type { INotificationDispatchService } from '../notification/service';

import {
  transactionToNotificationPayload,
  transferToNotificationPayload,
} from './notificationMappers';
import {
  mapInputToCreatePersonalTransaction,
  mapInputToCreatePersonalTransactionEntry,
  mapInputToCreatePersonalTransactionSchedule,
} from './prismaMappers';

class TransactionServiceError extends TRPCError {}

const sumTransactions = (
  currencyCode: string,
  transactions: TransactionEntry[],
): Money =>
  sumMoney(
    transactions.map((txn) => ({
      currencyCode,
      amount: txn.amount,
      scale: txn.scale,
    })),
    currencyCode,
  );

const calculateBalances = (
  groupSheet: Sheet,
  type: TransactionType,
  transactions: (TransactionEntry & { user: PrismaUser })[],
): GroupSheetParticipantItem[] => {
  const participants = new Map(
    transactions.map(({ userId, user: { name } }) => [
      userId,
      { id: userId, name },
    ]),
  ).values();

  return [...participants]
    .map(({ id, name }): GroupSheetParticipantItem => {
      const userTransactions = transactions.filter(
        ({ userId }) => userId === id,
      );

      const positiveTransactions = userTransactions.filter(
        ({ amount }) => 0 < amount,
      );

      const negativeTransactions = userTransactions.filter(
        ({ amount }) => amount < 0,
      );

      if (type === 'TRANSFER') {
        const balance = sumTransactions(
          groupSheet.currencyCode,
          userTransactions,
        );

        return {
          id,
          type: balance.amount < 0 ? 'transfer_from' : 'transfer_to',
          name,
          balance: {
            actual: balance,
            share: balance,
          },
        };
      }

      return {
        id,
        type: 'participant',
        name,
        balance: {
          actual: sumTransactions(
            groupSheet.currencyCode,
            type === 'EXPENSE' ? positiveTransactions : negativeTransactions,
          ),
          share: sumTransactions(
            groupSheet.currencyCode,
            type === 'EXPENSE' ? negativeTransactions : positiveTransactions,
          ),
        },
      };
    })
    .filter(
      ({ balance: { actual, share } }) =>
        actual.amount !== 0 || share.amount !== 0,
    )
    .sort((a, b) => a.balance.share.amount - b.balance.share.amount);
};

const verifyCurrencies = (
  sheetCurrencyCode: string,
  ...inputCurrencyCodes: string[]
) => {
  const allCodes = new Set([sheetCurrencyCode, ...inputCurrencyCodes]);
  if (allCodes.size !== 1 || !allCodes.has(sheetCurrencyCode)) {
    throw new TransactionServiceError({
      code: 'BAD_REQUEST',
      message: 'Currencies do not match',
    });
  }
};

const verifyAmountIsAbsolute = (money: Money) => {
  if (money.amount < 0) {
    throw new TransactionServiceError({
      code: 'BAD_REQUEST',
      message: 'Amount must be absolute',
    });
  }
};

export class TransactionService {
  constructor(
    private prismaClient: Pick<
      PrismaClient,
      | '$transaction'
      | 'transaction'
      | 'transactionSchedule'
      | 'transactionEntry'
      | 'sheetMemberships'
    >,
    private notificationService: INotificationDispatchService,
  ) {}

  async getAllUserTransactions(
    user: User,
    {
      from,
      to,
      category,
    }: {
      from: Temporal.Instant;
      to: Temporal.Instant;
      category: string | undefined;
    },
  ) {
    const data = await this.prismaClient.transaction.findMany({
      where: {
        type: { in: ['EXPENSE', 'INCOME'] },
        transactionEntries: { some: { userId: user.id } },
        spentAt: {
          gte: from.toString(),
          lte: to.toString(),
        },
        ...(category ? { category } : undefined),
      },
      include: {
        sheet: true,
        transactionEntries: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { spentAt: 'desc' },
    });

    const expenses = data
      .map(
        ({
          transactionEntries,
          amount: _amount,
          scale: _scale,
          ...transaction
        }) => ({
          ...transaction,
          money: sumTransactions(
            transaction.sheet.currencyCode,
            transactionEntries.filter(
              ({ amount, userId }) =>
                transaction.type === 'EXPENSE' &&
                amount < 0 &&
                userId === user.id,
            ),
          ),
        }),
      )
      .filter(({ money }) => money.amount !== 0);

    const earnings = data
      .map(
        ({
          transactionEntries,
          amount: _amount,
          scale: _scale,
          ...transaction
        }) => ({
          ...transaction,
          money: sumTransactions(
            transaction.sheet.currencyCode,
            transactionEntries.filter(
              ({ amount, userId }) =>
                transaction.type === 'INCOME' &&
                amount > 0 &&
                userId === user.id,
            ),
          ),
        }),
      )
      .filter(({ money }) => money.amount !== 0);

    return {
      expenses,
      earnings,
    };
  }

  async getPersonalSheetTransactions({
    personalSheet,
    limit,
  }: {
    personalSheet: Sheet;
    limit?: number | undefined;
  }) {
    return this.getTransactions({ sheetId: personalSheet.id, limit });
  }

  async getGroupSheetTransaction({
    groupSheet,
    limit,
  }: {
    groupSheet: Sheet;
    limit?: number | undefined;
  }) {
    const { transactions, total } = await this.getTransactions({
      sheetId: groupSheet.id,
      limit,
    });

    return {
      transactions: transactions.map((transaction) => ({
        ...transaction,
        participantBalances: calculateBalances(
          groupSheet,
          transaction.type,
          transaction.transactionEntries,
        ),
      })),
      total,
    };
  }

  async getTransactionSchedules({ sheetId }: { sheetId: string }) {
    return this.prismaClient.transactionSchedule.findMany({
      where: { sheetId },
      include: {
        transactions: true,
      },
      orderBy: { nextOccurrenceAt: 'asc' },
    });
  }

  private async getTransactions({
    sheetId,
    limit,
  }: {
    sheetId: string;
    limit?: number | undefined;
  }) {
    const [transactions, total] = await this.prismaClient.$transaction([
      this.prismaClient.transaction.findMany({
        where: { sheetId },
        include: {
          transactionEntries: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { spentAt: 'desc' },
        ...(limit != null ? { take: limit } : {}),
      }),
      this.prismaClient.transaction.count({ where: { sheetId } }),
    ]);

    return {
      transactions,
      total,
    };
  }

  async createPersonalSheetTransaction(
    user: User,
    input: Omit<CreatePersonalSheetTransactionInput, 'personalSheetId'>,
    personalSheet: Sheet,
  ) {
    verifyCurrencies(personalSheet.currencyCode, input.money.currencyCode);
    verifyAmountIsAbsolute(input.money);

    return this.prismaClient.transaction.create({
      include: {
        transactionEntries: {
          include: {
            user: true,
          },
        },
      },
      data: {
        ...mapInputToCreatePersonalTransaction(input, personalSheet),
        transactionEntries: {
          create: [mapInputToCreatePersonalTransactionEntry(input, user)],
        },
      },
    });
  }

  async updatePersonalSheetTransaction(
    user: User,
    input: Omit<UpdatePersonalSheetTransactionInput, 'personalSheetId'>,
    personalSheet: Sheet,
  ) {
    verifyCurrencies(personalSheet.currencyCode, input.money.currencyCode);
    verifyAmountIsAbsolute(input.money);

    const transaction = await this.prismaClient.transaction.findUnique({
      where: { id: input.id },
    });

    if (!transaction) {
      throw new TransactionServiceError({
        code: 'NOT_FOUND',
        message: 'Transaction not found',
      });
    }

    const [, result] = await this.prismaClient.$transaction([
      this.prismaClient.transaction.delete({
        where: { id: transaction.id },
      }),
      this.prismaClient.transaction.create({
        include: {
          transactionEntries: {
            include: {
              user: true,
            },
          },
        },
        data: {
          ...mapInputToCreatePersonalTransaction(
            input,
            personalSheet,
            transaction.id,
          ),
          createdAt: transaction.createdAt,
          transactionEntries: {
            create: [mapInputToCreatePersonalTransactionEntry(input, user)],
          },
        },
      }),
    ]);

    return result;
  }

  async createPersonalSheetTransactionSchedule(
    input: Omit<CreatePersonalSheetTransactionScheduleInput, 'personalSheetId'>,
    personalSheet: Sheet,
  ) {
    verifyCurrencies(personalSheet.currencyCode, input.money.currencyCode);
    verifyAmountIsAbsolute(input.money);

    return this.prismaClient.transactionSchedule.create({
      data: mapInputToCreatePersonalTransactionSchedule(input, personalSheet),
    });
  }

  async batchCreatePersonalSheetTransactions(
    user: User,
    input: Omit<CreatePersonalSheetTransactionInput, 'personalSheetId'>[],
    personalSheet: Sheet,
  ) {
    verifyCurrencies(
      personalSheet.currencyCode,
      ...input.map((txn) => txn.money.currencyCode),
    );

    input.forEach((txn) => {
      verifyAmountIsAbsolute(txn.money);
    });

    const inputWithIds = input.map((item) => ({ id: generateId(), item }));

    return this.prismaClient.$transaction([
      this.prismaClient.transaction.createMany({
        data: inputWithIds.map(({ id, item }) =>
          mapInputToCreatePersonalTransaction(item, personalSheet, id),
        ),
      }),
      this.prismaClient.transactionEntry.createMany({
        data: inputWithIds.map(({ id, item }) => ({
          ...mapInputToCreatePersonalTransactionEntry(item, user),
          transactionId: id,
        })),
      }),
    ]);
  }

  async createGroupSheetTransaction(
    user: User,
    input: Omit<CreateGroupSheetTransactionInput, 'groupSheetId'>,
    groupSheet: Sheet,
  ) {
    verifyCurrencies(
      groupSheet.currencyCode,
      input.money.currencyCode,
      ...input.splits.map(({ share }) => share.currencyCode),
    );

    verifyAmountIsAbsolute(input.money);

    const splitTotal = sumMoney(
      input.splits.map(({ share }) => share),
      groupSheet.currencyCode,
    );

    if (!equalMoney(input.money, splitTotal)) {
      throw new TransactionServiceError({
        code: 'BAD_REQUEST',
        message: 'Invalid splits',
      });
    }

    const transaction = await this.prismaClient.transaction.create({
      include: {
        transactionEntries: {
          include: {
            user: true,
          },
        },
      },
      data: {
        id: generateId(),
        sheet: { connect: { id: groupSheet.id } },
        amount: input.money.amount,
        scale: input.money.scale,
        type: input.type,
        category: input.category,
        description: input.description,
        spentAt: Temporal.ZonedDateTime.from(input.spentAt)
          .toInstant()
          .toString(),
        transactionEntries: {
          create: input.splits
            .filter(({ share }) => share.amount !== 0)
            .flatMap(
              (
                split,
              ): [
                Prisma.TransactionEntryCreateWithoutTransactionInput,
                Prisma.TransactionEntryCreateWithoutTransactionInput,
              ] => [
                {
                  id: generateId(),
                  user: {
                    connect: {
                      id: input.paidOrReceivedById,
                    },
                  },
                  amount:
                    input.type === 'EXPENSE'
                      ? split.share.amount
                      : -split.share.amount,
                  scale: split.share.scale,
                },
                {
                  id: generateId(),
                  user: { connect: { id: split.participantId } },
                  amount:
                    input.type === 'EXPENSE'
                      ? -split.share.amount
                      : split.share.amount,
                  scale: split.share.scale,
                },
              ],
            ),
        },
      },
    });

    const balances = calculateBalances(
      groupSheet,
      transaction.type,
      transaction.transactionEntries,
    );

    await this.notificationService.sendNotifications(
      Object.fromEntries(
        balances
          .filter(({ id }) => id !== user.id)
          .map(({ id, balance }): [string, NotificationPayload] => [
            id,
            transactionToNotificationPayload(
              { ...transaction, type: input.type },
              groupSheet,
              balance.share,
            ),
          ]),
      ),
    );

    return transaction;
  }

  async createSettlement(
    user: User,
    input: Omit<CreateGroupSheetSettlementInput, 'groupSheetId'>,
    groupSheet: Sheet,
  ) {
    verifyCurrencies(groupSheet.currencyCode, input.money.currencyCode);
    verifyAmountIsAbsolute(input.money);

    const transaction = await this.prismaClient.transaction.create({
      data: {
        id: generateId(),
        sheet: { connect: { id: groupSheet.id } },
        amount: input.money.amount,
        scale: input.money.scale,
        type: TransactionType.TRANSFER,
        category: 'transfer',
        description: '',
        spentAt: Temporal.Now.instant().toString(),
        transactionEntries: {
          create: [
            {
              id: generateId(),
              user: { connect: { id: input.fromId } },
              amount: input.money.amount,
              scale: input.money.scale,
            },
            {
              id: generateId(),
              user: { connect: { id: input.toId } },
              amount: -input.money.amount,
              scale: input.money.scale,
            },
          ],
        },
      },
    });

    const messages: Record<string, NotificationPayload> = {};
    if (input.fromId !== user.id)
      messages[input.fromId] = transferToNotificationPayload(
        { ...transaction, type: 'TRANSFER' },
        groupSheet,
        'sent',
      );
    if (input.toId !== user.id)
      messages[input.toId] = transferToNotificationPayload(
        { ...transaction, type: 'TRANSFER' },
        groupSheet,
        'received',
      );

    await this.notificationService.sendNotifications(messages);

    return transaction;
  }

  async getTransaction(id: string, sheet: Sheet) {
    return this.prismaClient.transaction.findUnique({
      where: { id, sheetId: sheet.id },
      include: {
        sheet: true,
      },
    });
  }

  async deleteTransaction(id: string, groupSheet: Sheet) {
    try {
      await this.prismaClient.transaction.delete({
        where: { id, sheetId: groupSheet.id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TransactionServiceError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      throw error;
    }
  }

  async deleteTransactionSchedule(id: string, groupSheet: Sheet) {
    try {
      await this.prismaClient.transactionSchedule.delete({
        where: { id, sheetId: groupSheet.id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TransactionServiceError({
          code: 'NOT_FOUND',
          message: 'Transaction schedule not found',
        });
      }

      throw error;
    }
  }

  async getParticipantSummaries(
    groupSheet: GroupSheetWithParticipants,
  ): Promise<TransactionSummaryResponse> {
    const mapSummary = (
      summary: {
        userId: string;
        scale: number;
        _sum: { amount: number | null };
      }[],
    ) =>
      Object.fromEntries(
        groupSheet.participants.map(({ id }) => [
          id,
          // we don't have an easy way to sum up values with different scales on the db side.
          // one could try to do amount * 10^scale and add those up, but you'd have to use
          // queryRaw, so we instead just group by scale and then add them up. in most cases
          // there should be only a single scale anyway.
          // (note: could use a view instead of queryRaw)
          // we negate this because the transaction amounts are stored flipped so that expenses
          // are stored negative and the owed payer balance is positive. to calculate who owes
          // (has a negative balance) or vice versa, it needs to be flipped back.
          negateMoney(
            sumMoney(
              summary
                .filter(({ userId }) => userId === id)
                .map(
                  ({ scale, _sum }): Money => ({
                    scale,
                    amount: _sum.amount ?? 0,
                    currencyCode: groupSheet.currencyCode,
                  }),
                ),
              groupSheet.currencyCode,
            ),
          ),
        ]),
      );

    const [balanceMap, participants] = await Promise.all([
      this.prismaClient.transactionEntry
        .groupBy({
          by: ['userId', 'scale'],
          where: {
            transaction: { sheetId: groupSheet.id },
          },
          _sum: { amount: true },
        })
        .then(mapSummary),
      // TODO: access via sheetService
      this.prismaClient.sheetMemberships.findMany({
        where: { sheetId: groupSheet.id },
        include: { participant: true },
      }),
    ]);

    return participants.map(({ participant: { name, id } }) => ({
      name,
      participantId: id,
      balance: balanceMap[id] ?? zeroMoney(groupSheet.currencyCode),
    }));
  }

  async getParticipantBalance(groupSheet: Sheet, userId: string) {
    const transactionEntries =
      await this.prismaClient.transactionEntry.findMany({
        where: {
          transaction: { sheetId: groupSheet.id },
          userId,
        },
      });

    const balance = sumMoney(
      transactionEntries.map(({ amount, scale }) => ({
        amount,
        scale,
        currencyCode: groupSheet.currencyCode,
      })),
      groupSheet.currencyCode,
    );

    return balance;
  }
}
