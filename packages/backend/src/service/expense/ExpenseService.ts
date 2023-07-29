import { Temporal } from '@js-temporal/polyfill';
import {
  type PrismaClient,
  type Prisma,
  ExpenseType,
  type Expense,
  type ExpenseTransactions,
  type User as PrismaUser,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';
import { dinero, equal } from 'dinero.js';

import {
  type Money,
  sumMoney,
  zeroMoney,
  moneyToDinero,
  negateMoney,
  getCurrency,
} from '../../money';
import { generateId } from '../../nanoid';
import { type NotificationService } from '../notification/NotificationService';
import { type NotificationPayload } from '../notification/types';
import { type GroupSheetWithParticipants, type Sheet } from '../sheet/types';
import { type User } from '../user/types';

import {
  type ExpenseSummaryResponse,
  type CreateExpenseInput,
  type CreateSettlementInput,
} from './types';

class ExpenseServiceError extends TRPCError {}

const expenseToPayload = (
  expense: Expense,
  group: Sheet,
  yourBalance: Omit<Money, 'currencyCode'>,
): NotificationPayload => ({
  type: 'expense',
  group,
  expense: {
    ...expense,
    money: {
      currencyCode: group.currencyCode,
      amount: expense.amount,
      scale: expense.scale,
    },
    yourBalance: {
      currencyCode: group.currencyCode,
      ...yourBalance,
    },
  },
});

const calculateBalances = (
  group: Sheet,
  transactions: (ExpenseTransactions & { user: PrismaUser })[],
) => {
  const participants = new Map(
    transactions.map(({ userId, user: { name } }) => [
      userId,
      { id: userId, name },
    ]),
  ).values();

  const participantBalances = [...participants]
    .map(({ id, name }) => ({
      id,
      name,
      balance:
        sumMoney(
          transactions
            .filter(({ userId }) => userId === id)
            .map((txn) => ({
              currencyCode: group.currencyCode,
              amount: txn.amount,
              scale: txn.scale,
            })),
        ) ?? zeroMoney(group.currencyCode),
    }))
    .sort((a, b) => a.balance.amount - b.balance.amount);

  return participantBalances;
};

export class ExpenseService {
  constructor(
    private prismaClient: PrismaClient,
    private notificationService: NotificationService,
  ) {}

  async getExpenses({
    group,
    limit,
  }: {
    group: Sheet;
    limit?: number | undefined;
  }) {
    const [expenses, total] = await this.prismaClient.$transaction([
      this.prismaClient.expense.findMany({
        where: { sheetId: group.id },
        include: {
          transactions: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { spentAt: 'desc' },
        ...(limit ? { take: limit } : {}),
      }),
      this.prismaClient.expense.count({ where: { sheetId: group.id } }),
    ]);

    return {
      expenses: expenses.map((expense) => ({
        ...expense,
        participantBalances: calculateBalances(group, expense.transactions),
      })),
      total,
    };
  }

  async createExpense(
    user: User,
    input: Omit<CreateExpenseInput, 'groupId'>,
    group: Sheet,
  ) {
    if (group.currencyCode !== input.money.currencyCode) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    const allCurrencies = new Set([
      input.money.currencyCode,
      ...input.splits.map(({ share: { currencyCode } }) => currencyCode),
    ]);

    if (allCurrencies.size !== 1) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    const splitTotal = sumMoney(input.splits.map(({ share }) => share));

    if (
      !splitTotal ||
      !equal(
        dinero({
          amount: input.money.amount,
          scale: input.money.scale,
          currency: getCurrency(input.money.currencyCode),
        }),
        moneyToDinero(splitTotal),
      )
    ) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Invalid splits',
      });
    }

    const expense = await this.prismaClient.expense.create({
      include: {
        transactions: {
          include: {
            user: true,
          },
        },
      },
      data: {
        id: generateId(),
        sheet: { connect: { id: group.id } },
        amount: input.money.amount,
        scale: input.money.scale,
        type: ExpenseType.EXPENSE,
        category: input.category,
        description: input.description,
        spentAt: new Date(
          Temporal.ZonedDateTime.from(
            input.spentAt,
          ).toInstant().epochMilliseconds,
        ),
        transactions: {
          create: input.splits.flatMap(
            (
              split,
            ): [
              Prisma.ExpenseTransactionsCreateWithoutExpenseInput,
              Prisma.ExpenseTransactionsCreateWithoutExpenseInput,
            ] => [
              {
                id: generateId(),
                user: { connect: { id: input.paidById } },
                amount: -split.share.amount,
                scale: split.share.scale,
              },
              {
                id: generateId(),
                user: { connect: { id: split.participantId } },
                amount: split.share.amount,
                scale: split.share.scale,
              },
            ],
          ),
        },
      },
    });

    const balances = calculateBalances(group, expense.transactions);

    // TODO: Background task
    await this.notificationService.sendNotifications(
      Object.fromEntries(
        balances
          .filter(({ id, balance }) => id !== user.id && balance.amount !== 0)
          .map(({ id, balance }): [string, NotificationPayload] => [
            id,
            expenseToPayload(expense, group, balance),
          ]),
      ),
    );

    return expense;
  }

  async createSettlement(
    user: User,
    input: Omit<CreateSettlementInput, 'groupId'>,
    group: Sheet,
  ) {
    if (group.currencyCode !== input.money.currencyCode) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    const expense = await this.prismaClient.expense.create({
      data: {
        id: generateId(),
        sheet: { connect: { id: group.id } },
        amount: input.money.amount,
        scale: input.money.scale,
        type: ExpenseType.TRANSFER,
        category: 'transfer',
        description: '',
        spentAt: new Date(Temporal.Now.instant().epochMilliseconds),
        transactions: {
          create: [
            {
              id: generateId(),
              user: { connect: { id: input.fromId } },
              amount: -input.money.amount,
              scale: input.money.scale,
            },
            {
              id: generateId(),
              user: { connect: { id: input.toId } },
              amount: input.money.amount,
              scale: input.money.scale,
            },
          ],
        },
      },
    });

    // TODO: Background task
    const messages: Record<string, NotificationPayload> = {};
    if (input.fromId !== user.id)
      messages[input.fromId] = expenseToPayload(
        expense,
        group,
        negateMoney(input.money),
      );
    if (input.toId !== user.id)
      messages[input.toId] = expenseToPayload(expense, group, input.money);

    await this.notificationService.sendNotifications(messages);

    return expense;
  }

  async deleteExpense(id: string, group: Sheet) {
    try {
      await this.prismaClient.expense.delete({
        where: { id, sheetId: group.id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ExpenseServiceError({
          code: 'NOT_FOUND',
          message: 'Expense not found',
        });
      }

      throw error;
    }
  }

  async getParticipantSummaries(
    group: GroupSheetWithParticipants,
  ): Promise<ExpenseSummaryResponse> {
    const mapSummary = (
      summary: {
        userId: string;
        scale: number;
        _sum: { amount: number | null };
      }[],
    ) =>
      Object.fromEntries(
        group.participants.map(({ id }) => [
          id,
          // we don't have an easy way to sum up values with different scales on the db side.
          // one could try to do amount * 10^scale and add those up, but you'd have to use
          // queryRaw, so we instead just group by scale and then add them up. in most cases
          // there should be only a single scale anyway.
          // (note: could use a view instead of queryRaw)
          sumMoney(
            summary
              .filter(({ userId }) => userId === id)
              .map(
                ({ scale, _sum }): Money => ({
                  scale,
                  amount: _sum.amount ?? 0,
                  currencyCode: group.currencyCode,
                }),
              ),
          ),
        ]),
      );

    const [costMap, spentMap, sentMap, receivedMap, participants] =
      await Promise.all([
        this.prismaClient.expenseTransactions
          .groupBy({
            by: ['userId', 'scale'],
            // amount > 0 means this is money spent _for_ the user by someone else (or themselves)
            where: {
              expense: { sheetId: group.id, type: ExpenseType.EXPENSE },
              amount: { gt: 0 },
            },
            _sum: { amount: true },
          })
          .then(mapSummary),
        this.prismaClient.expenseTransactions
          .groupBy({
            by: ['userId', 'scale'],
            // amount < 0 means this is money spent _by_ the user for someone else (or themselves)
            where: {
              expense: { sheetId: group.id, type: ExpenseType.EXPENSE },
              amount: { lt: 0 },
            },
            _sum: { amount: true },
          })
          .then(mapSummary),
        this.prismaClient.expenseTransactions
          .groupBy({
            by: ['userId', 'scale'],
            // amount < 0 means this is money sent to the user from someone else
            where: {
              expense: { sheetId: group.id, type: ExpenseType.TRANSFER },
              amount: { lt: 0 },
            },
            _sum: { amount: true },
          })
          .then(mapSummary),
        this.prismaClient.expenseTransactions
          .groupBy({
            by: ['userId', 'scale'],
            // amount > 0 means this is money received from someone else
            where: {
              expense: { sheetId: group.id, type: ExpenseType.TRANSFER },
              amount: { gt: 0 },
            },
            _sum: { amount: true },
          })
          .then(mapSummary),
        this.prismaClient.sheetMemberships.findMany({
          where: { sheetId: group.id },
          include: { participant: true },
        }),
      ]);

    const zero = zeroMoney(group.currencyCode);

    return participants.map(({ participant: { name, id } }) => {
      const cost = costMap[id] ?? zero;
      const spent = spentMap[id] ?? zero;
      const sent = sentMap[id] ?? zero;
      const received = receivedMap[id] ?? zero;

      const balance = sumMoney([cost, spent, sent, received]) ?? zero;

      return {
        name,
        participantId: id,
        cost,
        spent,
        sent,
        received,
        balance,
      };
    });
  }
}
