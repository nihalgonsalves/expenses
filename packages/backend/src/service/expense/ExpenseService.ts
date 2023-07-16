import { Temporal } from '@js-temporal/polyfill';
import { type PrismaClient, type Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';
import { dinero, equal } from 'dinero.js';

import { getCurrency } from '../..';
import {
  type Money,
  sumMoney,
  zeroMoney,
  moneyToDinero,
  addMoney,
} from '../../money';
import { type GroupWithParticipants, type Group } from '../group/types';

import { type ExpenseSummaryResponse, type CreateExpenseInput } from './types';

class ExpenseServiceError extends TRPCError {}

export class ExpenseService {
  constructor(private prismaClient: PrismaClient) {}

  async getExpenses({
    groupId,
    limit,
  }: {
    groupId: string;
    limit?: number | undefined;
  }) {
    const [expenses, total] = await this.prismaClient.$transaction([
      this.prismaClient.expense.findMany({
        where: { groupId },
        include: {
          group: true,
          transactions: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { spentAt: 'desc' },
        ...(limit ? { take: limit } : {}),
      }),
      this.prismaClient.expense.count({ where: { groupId } }),
    ]);

    return { expenses, total };
  }

  async createExpense(
    input: Omit<CreateExpenseInput, 'groupId'>,
    group: Group,
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

    return this.prismaClient.expense.create({
      data: {
        group: { connect: { id: group.id } },
        amount: input.money.amount,
        scale: input.money.scale,
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
                user: { connect: { id: input.paidById } },
                amount: -split.share.amount,
                scale: split.share.scale,
              },
              {
                user: { connect: { id: split.participantId } },
                amount: split.share.amount,
                scale: split.share.scale,
              },
            ],
          ),
        },
      },
    });
  }

  async deleteExpense(id: string, group: Group) {
    try {
      await this.prismaClient.expense.delete({
        where: { id, groupId: group.id },
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
    group: GroupWithParticipants,
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
          sumMoney(
            summary
              .filter(({ userId }) => userId === id)
              .map(
                ({ scale, _sum }): Money => ({
                  scale,
                  amount: _sum?.amount ?? 0,
                  currencyCode: group.currencyCode,
                }),
              ),
          ),
        ]),
      );

    const [costMap, spentMap, participants] = await Promise.all([
      this.prismaClient.expenseTransactions
        .groupBy({
          by: ['userId', 'scale'],
          // amount > 0 means this is money spent _for_ the user by someone else (or themselves)
          where: { expense: { groupId: group.id }, amount: { gt: 0 } },
          _sum: { amount: true },
        })
        .then(mapSummary),
      this.prismaClient.expenseTransactions
        .groupBy({
          by: ['userId', 'scale'],
          // amount < 0 means this is money spent _by_ the user for someone else (or themselves)
          where: { expense: { groupId: group.id }, amount: { lt: 0 } },
          _sum: { amount: true },
        })
        .then(mapSummary),
      this.prismaClient.groupParticipants.findMany({
        where: { groupId: group.id },
        include: { participant: true },
      }),
    ]);

    return participants.map(({ participant: { name, id } }) => {
      const cost = costMap[id] ?? zeroMoney(group.currencyCode);

      const spentRaw = spentMap[id] ?? zeroMoney(group.currencyCode);
      const spent = { ...spentRaw, amount: Math.abs(spentRaw.amount) };

      const balance = addMoney(cost, spentRaw);

      return {
        name,
        participantId: id,
        cost,
        spent,
        balance,
      };
    });
  }
}
