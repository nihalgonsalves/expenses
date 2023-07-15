import { faker } from '@faker-js/faker';
import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import {
  expenseFactory,
  groupFactory,
  userFactory,
} from '../../test/factories';
import { getTRPCCaller } from '../../test/getTRPCCaller';

const { prisma, useProtectedCaller } = await getTRPCCaller();

const createExpenseInput = (groupId: string, paidById: string) => ({
  groupId,
  description: 'Test expense',
  money: { amount: 100_00, scale: 2, currencyCode: 'EUR' },
  paidById,
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
  splits: [
    {
      participantId: paidById,
      share: { amount: 100_00, scale: 2, currencyCode: 'EUR' },
    },
  ],
});

describe('createExpense', () => {
  it('creates an expense', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, { withOwnerId: user.id });

    const response = await caller.expense.createExpense(
      createExpenseInput(group.id, user.id),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.expense.findUnique({
      where: { id: response.id },
      include: { transactions: true },
    });

    expect(expense?.transactions).toMatchObject([
      { scale: 2, amount: 100_00, userId: user.id },
      { scale: 2, amount: -100_00, userId: user.id },
    ]);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.createExpense(
        createExpenseInput(faker.string.uuid(), user.id),
      ),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma);

    await expect(
      caller.expense.createExpense(createExpenseInput(group.id, user.id)),
    ).rejects.toThrow('Group not found');
  });
});

describe('getExpenses', () => {
  it('returns all expenses for the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, { withOwnerId: user.id });
    const expense = await expenseFactory(prisma, group, user.id);

    const response = await caller.expense.getExpenses(group.id);

    expect(response).toMatchObject([
      {
        id: expense.id,
        description: expense.description,
      },
    ]);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.expense.getExpenses('invalid-id')).rejects.toThrow(
      'Group not found',
    );
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma);

    await expect(caller.expense.getExpenses(group.id)).rejects.toThrow(
      'Group not found',
    );
  });
});
