import { Temporal } from '@js-temporal/polyfill';
import { type PrismaClient, type Prisma } from '@prisma/client';

import { type CreateExpenseInput } from './types';

export class ExpenseService {
  constructor(private prisma: PrismaClient) {}

  async getExpenses(groupId: string) {
    return this.prisma.expense.findMany({
      where: { groupId },
      include: {
        group: true,
        transactions: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async createExpense(input: CreateExpenseInput) {
    return this.prisma.expense.create({
      data: {
        group: { connect: { id: input.groupId } },
        currency: input.money.currencyCode,
        amount: input.money.amount,
        scale: input.money.scale,
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
}
