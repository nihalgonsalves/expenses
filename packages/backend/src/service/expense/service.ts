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
} from '../../utils/money';
import { generateId } from '../../utils/nanoid';
import { type NotificationService } from '../notification/service';
import { type NotificationPayload } from '../notification/types';
import { type GroupSheetWithParticipants, type Sheet } from '../sheet/types';
import { type User } from '../user/types';

import {
  type ExpenseSummaryResponse,
  type CreateGroupSheetExpenseInput,
  type CreateGroupSheetSettlementInput,
  type CreatePersonalSheetExpenseInput,
} from './types';

class ExpenseServiceError extends TRPCError {}

const expenseToPayload = (
  expense: Expense,
  groupSheet: Sheet,
  yourBalance: Omit<Money, 'currencyCode'>,
): NotificationPayload => ({
  type: 'expense',
  groupSheet,
  expense: {
    ...expense,
    money: {
      currencyCode: groupSheet.currencyCode,
      amount: expense.amount,
      scale: expense.scale,
    },
    yourBalance: {
      currencyCode: groupSheet.currencyCode,
      ...yourBalance,
    },
  },
});

const calculateBalances = (
  groupSheet: Sheet,
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
              currencyCode: groupSheet.currencyCode,
              amount: txn.amount,
              scale: txn.scale,
            })),
        ) ?? zeroMoney(groupSheet.currencyCode),
    }))
    .sort((a, b) => a.balance.amount - b.balance.amount);

  return participantBalances;
};

const mapInputToCreatePersonalExpense = (
  input: Omit<CreatePersonalSheetExpenseInput, 'personalSheetId'>,
  personalSheet: Sheet,
  id = generateId(),
): Prisma.ExpenseUncheckedCreateInput => ({
  id,
  sheetId: personalSheet.id,
  amount: input.money.amount,
  scale: input.money.scale,
  type: ExpenseType.EXPENSE,
  category: input.category,
  description: input.description,
  spentAt: new Date(
    Temporal.ZonedDateTime.from(input.spentAt).toInstant().epochMilliseconds,
  ),
});

const mapInputToCreatePersonalExpenseTransaction = (
  input: Omit<CreatePersonalSheetExpenseInput, 'personalSheetId'>,
  user: User,
): Omit<Prisma.ExpenseTransactionsUncheckedCreateInput, 'expenseId'> => ({
  id: generateId(),
  userId: user.id,
  amount: -input.money.amount,
  scale: input.money.scale,
});

export class ExpenseService {
  constructor(
    private prismaClient: PrismaClient,
    private notificationService: NotificationService,
  ) {}

  async getPersonalSheetExpenses({
    personalSheet,
    limit,
  }: {
    personalSheet: Sheet;
    limit?: number | undefined;
  }) {
    return this.getExpenses({ sheetId: personalSheet.id, limit });
  }

  async getGroupSheetExpenses({
    groupSheet,
    limit,
  }: {
    groupSheet: Sheet;
    limit?: number | undefined;
  }) {
    const { expenses, total } = await this.getExpenses({
      sheetId: groupSheet.id,
      limit,
    });

    return {
      expenses: expenses.map((expense) => ({
        ...expense,
        participantBalances: calculateBalances(
          groupSheet,
          expense.transactions,
        ),
      })),
      total,
    };
  }

  private async getExpenses({
    sheetId,
    limit,
  }: {
    sheetId: string;
    limit?: number | undefined;
  }) {
    const [expenses, total] = await this.prismaClient.$transaction([
      this.prismaClient.expense.findMany({
        where: { sheetId },
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
      this.prismaClient.expense.count({ where: { sheetId } }),
    ]);

    return {
      expenses,
      total,
    };
  }

  async createPersonalSheetExpense(
    user: User,
    input: Omit<CreatePersonalSheetExpenseInput, 'personalSheetId'>,
    personalSheet: Sheet,
  ) {
    if (personalSheet.currencyCode !== input.money.currencyCode) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    return this.prismaClient.expense.create({
      include: {
        transactions: {
          include: {
            user: true,
          },
        },
      },
      data: {
        ...mapInputToCreatePersonalExpense(input, personalSheet),
        transactions: {
          create: [mapInputToCreatePersonalExpenseTransaction(input, user)],
        },
      },
    });
  }

  async batchCreatePersonalSheetExpenses(
    user: User,
    input: Omit<CreatePersonalSheetExpenseInput, 'personalSheetId'>[],
    personalSheet: Sheet,
  ) {
    const allCurrencies = new Set(input.map((txn) => txn.money.currencyCode));

    if (
      allCurrencies.size > 1 ||
      !allCurrencies.has(personalSheet.currencyCode)
    ) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    const inputWithIds = input.map((item) => ({ id: generateId(), item }));

    return this.prismaClient.$transaction([
      this.prismaClient.expense.createMany({
        data: inputWithIds.map(({ id, item }) =>
          mapInputToCreatePersonalExpense(item, personalSheet, id),
        ),
      }),
      this.prismaClient.expenseTransactions.createMany({
        data: inputWithIds.map(({ id, item }) => ({
          ...mapInputToCreatePersonalExpenseTransaction(item, user),
          expenseId: id,
        })),
      }),
    ]);
  }

  async createGroupSheetExpense(
    user: User,
    input: Omit<CreateGroupSheetExpenseInput, 'groupSheetId'>,
    groupSheet: Sheet,
  ) {
    if (groupSheet.currencyCode !== input.money.currencyCode) {
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
        sheet: { connect: { id: groupSheet.id } },
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

    const balances = calculateBalances(groupSheet, expense.transactions);

    // TODO: Background task
    await this.notificationService.sendNotifications(
      Object.fromEntries(
        balances
          .filter(({ id, balance }) => id !== user.id && balance.amount !== 0)
          .map(({ id, balance }): [string, NotificationPayload] => [
            id,
            expenseToPayload(expense, groupSheet, balance),
          ]),
      ),
    );

    return expense;
  }

  async createSettlement(
    user: User,
    input: Omit<CreateGroupSheetSettlementInput, 'groupSheetId'>,
    groupSheet: Sheet,
  ) {
    if (groupSheet.currencyCode !== input.money.currencyCode) {
      throw new ExpenseServiceError({
        code: 'BAD_REQUEST',
        message: 'Currencies do not match',
      });
    }

    const expense = await this.prismaClient.expense.create({
      data: {
        id: generateId(),
        sheet: { connect: { id: groupSheet.id } },
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
        groupSheet,
        negateMoney(input.money),
      );
    if (input.toId !== user.id)
      messages[input.toId] = expenseToPayload(expense, groupSheet, input.money);

    await this.notificationService.sendNotifications(messages);

    return expense;
  }

  async deleteExpense(id: string, groupSheet: Sheet) {
    try {
      await this.prismaClient.expense.delete({
        where: { id, sheetId: groupSheet.id },
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
    groupSheet: GroupSheetWithParticipants,
  ): Promise<ExpenseSummaryResponse> {
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
              expense: { sheetId: groupSheet.id, type: ExpenseType.EXPENSE },
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
              expense: { sheetId: groupSheet.id, type: ExpenseType.EXPENSE },
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
              expense: { sheetId: groupSheet.id, type: ExpenseType.TRANSFER },
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
              expense: { sheetId: groupSheet.id, type: ExpenseType.TRANSFER },
              amount: { gt: 0 },
            },
            _sum: { amount: true },
          })
          .then(mapSummary),
        this.prismaClient.sheetMemberships.findMany({
          where: { sheetId: groupSheet.id },
          include: { participant: true },
        }),
      ]);

    const zero = zeroMoney(groupSheet.currencyCode);

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
