import { faker } from '@faker-js/faker';
import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import {
  currencyCodeFactory,
  groupFactory,
  userFactory,
} from '../../test/factories';
import { getTRPCCaller } from '../../test/getTRPCCaller';

const { prisma, useProtectedCaller } = await getTRPCCaller();

const createExpenseInput = (
  groupId: string,
  currencyCode: string,
  paidById: string,
  otherId: string,
) => ({
  groupId,
  description: 'Test expense',
  category: 'other',
  money: { amount: 100_00, scale: 2, currencyCode },
  paidById,
  spentAt: Temporal.Now.zonedDateTimeISO().toString(),
  splits: [
    {
      participantId: paidById,
      share: { amount: 25_00, scale: 2, currencyCode },
    },
    {
      participantId: otherId,
      share: { amount: 75_00, scale: 2, currencyCode },
    },
  ],
});

describe('createExpense', () => {
  it('creates an expense', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const response = await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, user.id, member.id),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.expense.findUnique({
      where: { id: response.id },
      include: { transactions: true },
    });

    expect(expense?.transactions).toMatchObject([
      { scale: 2, amount: +75_00, userId: member.id },
      { scale: 2, amount: -75_00, userId: user.id },
      { scale: 2, amount: +25_00, userId: user.id },
      { scale: 2, amount: -25_00, userId: user.id },
    ]);
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const invalidInput = createExpenseInput(group.id, 'GBP', user.id, user.id);

    await expect(caller.expense.createExpense(invalidInput)).rejects.toThrow(
      'Currencies do not match',
    );
  });

  it("returns 400 if the split currencies do doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const input = createExpenseInput(
      group.id,
      group.currencyCode,
      user.id,
      user.id,
    );

    input.splits[0]!.share.currencyCode = 'GBP';

    await expect(caller.expense.createExpense(input)).rejects.toThrow(
      'Currencies do not match',
    );
  });

  it("returns 400 if shares don't add up to the total amount", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createExpenseInput(
      group.id,
      group.currencyCode,
      user.id,
      user.id,
    );

    input.splits[0]!.share.amount = 10_00;

    await expect(caller.expense.createExpense(input)).rejects.toThrow(
      'Invalid splits',
    );
  });

  it('returns 400 if split participants are not part of the group', async () => {
    const user = await userFactory(prisma);
    const otherUser = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createExpenseInput(
      group.id,
      group.currencyCode,
      user.id,
      otherUser.id,
    );

    await expect(caller.expense.createExpense(input)).rejects.toThrow(
      'Invalid participants',
    );
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.createExpense(
        createExpenseInput(
          faker.string.uuid(),
          currencyCodeFactory(),
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma);

    await expect(
      caller.expense.createExpense(
        createExpenseInput(group.id, group.currencyCode, user.id, user.id),
      ),
    ).rejects.toThrow('Group not found');
  });
});

describe('deleteExpense', () => {
  it('deletes an expense', async () => {
    const user = await userFactory(prisma);

    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const expense = await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, user.id, member.id),
    );

    await caller.expense.deleteExpense({
      groupId: group.id,
      expenseId: expense.id,
    });

    expect(
      await prisma.expense.findUnique({ where: { id: expense.id } }),
    ).toBeNull();
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherGroupUser = await userFactory(prisma);
    const otherGroupCaller = useProtectedCaller(otherGroupUser);

    const group = await groupFactory(prisma, {
      withOwnerId: otherGroupUser.id,
    });

    const expense = await otherGroupCaller.expense.createExpense(
      createExpenseInput(
        group.id,
        group.currencyCode,
        otherGroupUser.id,
        otherGroupUser.id,
      ),
    );

    await expect(
      caller.expense.deleteExpense({
        groupId: group.id,
        expenseId: expense.id,
      }),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the expense is from another group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
    });

    const expense = await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, user.id, user.id),
    );

    await expect(
      caller.expense.deleteExpense({
        groupId: faker.string.uuid(),
        expenseId: expense.id,
      }),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the expense does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.expense.deleteExpense({
        groupId: group.id,
        expenseId: faker.string.uuid(),
      }),
    ).rejects.toThrow('Expense not found');
  });
});

describe('getExpenses', () => {
  it('returns all expenses for the group', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const expense = await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, user.id, member.id),
    );

    const { expenses, total } = await caller.expense.getExpenses({
      groupId: group.id,
    });

    expect(expenses).toMatchObject([
      {
        id: expense.id,
        description: expense.description,
        paidBy: [{ id: user.id }],
        paidFor: [{ id: member.id }, { id: user.id }],
      },
    ]);

    expect(total).toBe(1);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.getExpenses({ groupId: faker.string.uuid() }),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma);

    await expect(
      caller.expense.getExpenses({ groupId: group.id }),
    ).rejects.toThrow('Group not found');
  });
});

describe('getParticipantSummaries', () => {
  it('returns spent, cost and balance amount for each participant', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const paidById = user.id;
    const otherId = member.id;

    await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, paidById, otherId),
    );

    const summary = await caller.expense.getParticipantSummaries(group.id);

    expect(summary).toMatchObject([
      {
        balance: { amount: -75_00, scale: 2 },
        cost: { amount: 25_00, scale: 2 },
        participantId: user.id,
        name: user.name,
        spent: { amount: 100_00, scale: 2 },
      },
      {
        balance: { amount: 75_00, scale: 2 },
        cost: { amount: 75_00, scale: 2 },
        participantId: member.id,
        name: member.name,
        spent: { amount: 0, scale: 0 },
      },
    ]);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.getParticipantSummaries(faker.string.uuid()),
    ).rejects.toThrow('Group not found');
  });

  it('returns 404 if the user is not part of the group', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma);

    await expect(
      caller.expense.getParticipantSummaries(group.id),
    ).rejects.toThrow('Group not found');
  });
});
