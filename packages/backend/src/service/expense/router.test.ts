import { ExpenseType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  currencyCodeFactory,
  groupSheetFactory,
  userFactory,
} from '../../../test/factories';
import { getTRPCCaller } from '../../../test/getTRPCCaller';
import { createExpenseInput } from '../../../test/input';
import { generateId } from '../../utils/nanoid';

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe('createExpense', () => {
  it('creates an expense', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
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

    expect(expense).toMatchObject({
      type: ExpenseType.EXPENSE,
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

    const group = await groupSheetFactory(prisma, {
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

    const group = await groupSheetFactory(prisma, {
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

    const group = await groupSheetFactory(prisma, {
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

    const group = await groupSheetFactory(prisma, {
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
          generateId(),
          currencyCodeFactory(),
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma);

    await expect(
      caller.expense.createExpense(
        createExpenseInput(group.id, group.currencyCode, user.id, user.id),
      ),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('createSettlement', () => {
  it('creates an settlement', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const response = await caller.expense.createSettlement({
      groupId: group.id,
      money: { amount: 100_00, scale: 2, currencyCode: group.currencyCode },
      fromId: user.id,
      toId: member.id,
    });

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.expense.findUnique({
      where: { id: response.id },
      include: { transactions: true },
    });

    expect(expense).toMatchObject({
      type: ExpenseType.TRANSFER,
    });

    expect(expense?.transactions).toMatchObject([
      { scale: 2, amount: +100_00, userId: member.id },
      { scale: 2, amount: -100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    await expect(
      caller.expense.createSettlement({
        groupId: group.id,
        money: { amount: 100_00, scale: 2, currencyCode: 'GBP' },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow('Currencies do not match');
  });

  it('returns 400 if participants are not part of the group', async () => {
    const [user, otherUser] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.expense.createSettlement({
        groupId: group.id,
        money: { amount: 100_00, scale: 2, currencyCode: group.currencyCode },
        fromId: user.id,
        toId: otherUser.id,
      }),
    ).rejects.toThrow('Invalid participants');
  });

  it('returns 404 if the group does not exist', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.createSettlement({
        groupId: generateId(),
        money: { amount: 100_00, scale: 2, currencyCode: 'EUR' },
        fromId: user.id,
        toId: member.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma);

    await expect(
      caller.expense.createSettlement({
        groupId: group.id,
        money: { amount: 100_00, scale: 2, currencyCode: group.currencyCode },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });
});
describe('deleteExpense', () => {
  it('deletes an expense', async () => {
    const user = await userFactory(prisma);

    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
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

    const group = await groupSheetFactory(prisma, {
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
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the expense is from another group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const expense = await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, user.id, user.id),
    );

    await expect(
      caller.expense.deleteExpense({
        groupId: generateId(),
        expenseId: expense.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the expense does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.expense.deleteExpense({
        groupId: group.id,
        expenseId: generateId(),
      }),
    ).rejects.toThrow('Expense not found');
  });
});

describe('getExpenses', () => {
  it('returns all expenses for the group', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
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
        participants: [
          { id: user.id, balance: { amount: -75_00, scale: 2 } },
          { id: member.id, balance: { amount: 75_00, scale: 2 } },
        ],
      },
    ]);

    expect(total).toBe(1);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.getExpenses({ groupId: generateId() }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma);

    await expect(
      caller.expense.getExpenses({ groupId: group.id }),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('getParticipantSummaries', () => {
  it('returns spent, cost, sent, received and balance amount for each participant', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const paidById = user.id;
    const otherId = member.id;

    await caller.expense.createExpense(
      createExpenseInput(group.id, group.currencyCode, paidById, otherId),
    );

    await caller.expense.createSettlement({
      groupId: group.id,
      fromId: member.id,
      toId: user.id,
      money: { currencyCode: group.currencyCode, amount: 13_00, scale: 2 },
    });

    const summary = await caller.expense.getParticipantSummaries(group.id);

    expect(summary).toMatchObject([
      {
        balance: { amount: -62_00, scale: 2 },
        cost: { amount: 25_00, scale: 2 },
        participantId: user.id,
        name: user.name,
        spent: { amount: -100_00, scale: 2 },
        sent: { amount: 0, scale: 0 },
        received: { amount: 13_00, scale: 2 },
      },
      {
        balance: { amount: 62_00, scale: 2 },
        cost: { amount: 75_00, scale: 2 },
        participantId: member.id,
        name: member.name,
        spent: { amount: 0, scale: 0 },
        sent: { amount: -13_00, scale: 2 },
        received: { amount: 0, scale: 0 },
      },
    ]);
  });

  it('returns 404 if the group does not exist', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

    await expect(
      caller.expense.getParticipantSummaries(generateId()),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not part of the group', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma);

    await expect(
      caller.expense.getParticipantSummaries(group.id),
    ).rejects.toThrow('Sheet not found');
  });
});
