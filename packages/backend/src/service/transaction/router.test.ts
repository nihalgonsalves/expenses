import { TransactionType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import {
  currencyCodeFactory,
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from '../../../test/factories';
import { getTRPCCaller } from '../../../test/getTRPCCaller';
import {
  createGroupSheetTransactionInput,
  createPersonalSheetTransactionInput,
} from '../../../test/input';
import { generateId } from '../../utils/nanoid';

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe('createPersonalSheetExpense', () => {
  it('creates an expense', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const response = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        'EXPENSE',
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.EXPENSE,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: -100_00, userId: user.id },
    ]);
  });

  // naming is hard
  it('creates an income "expense"', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const response = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        'INCOME',
        100_00,
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.INCOME,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: 100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      'GBP',
      'EXPENSE',
    );

    await expect(
      caller.transaction.createPersonalSheetTransaction(invalidInput),
    ).rejects.toThrow('Currencies do not match');
  });

  it('returns 404 if the personalSheet does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createPersonalSheetTransaction(
        createPersonalSheetTransactionInput(
          generateId(),
          currencyCodeFactory(),
          'EXPENSE',
        ),
      ),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not the personalSheet owner', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.createPersonalSheetTransaction(
        createPersonalSheetTransactionInput(
          groupSheet.id,
          groupSheet.currencyCode,
          'EXPENSE',
        ),
      ),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('batchCreatePersonalSheetExpenses', () => {
  it('creates expenses', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await caller.transaction.batchCreatePersonalSheetTransactions({
      personalSheetId: personalSheet.id,
      transactions: [
        createPersonalSheetTransactionInput(
          personalSheet.id,
          personalSheet.currencyCode,
          'EXPENSE',
        ),
      ],
    });

    const expense = await prisma.transaction.findFirst({
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.EXPENSE,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: -100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      'GBP',
      'EXPENSE',
    );

    await expect(
      caller.transaction.batchCreatePersonalSheetTransactions({
        personalSheetId: personalSheet.id,
        transactions: [invalidInput],
      }),
    ).rejects.toThrow('Currencies do not match');
  });

  it("returns 400 if the amount isn't abosolute", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      personalSheet.currencyCode,
      'EXPENSE',
      -100_00,
    );

    await expect(
      caller.transaction.batchCreatePersonalSheetTransactions({
        personalSheetId: personalSheet.id,
        transactions: [invalidInput],
      }),
    ).rejects.toThrow('Amount must be absolute');
  });

  it.todo('returns 404 if the personalSheet does not exist');

  it.todo('returns 404 if the user is not the personalSheet owner');
});

describe('createGroupSheetExpenseOrIncome', () => {
  it('creates an expense', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const response = await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        'EXPENSE',
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        member.id,
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.EXPENSE,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: -75_00, userId: member.id },
      { scale: 2, amount: +75_00, userId: user.id },
      { scale: 2, amount: -25_00, userId: user.id },
      { scale: 2, amount: +25_00, userId: user.id },
    ]);
  });

  it('creates an income "expense"', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const response = await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        'INCOME',
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        member.id,
        100_00,
        25_00,
        75_00,
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.INCOME,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: +75_00, userId: member.id },
      { scale: 2, amount: -75_00, userId: user.id },
      { scale: 2, amount: +25_00, userId: user.id },
      { scale: 2, amount: -25_00, userId: user.id },
    ]);
  });

  it('returns 400 if the amount is not absolute', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const invalidInput = createGroupSheetTransactionInput(
      'EXPENSE',
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      user.id,
      -100_00,
      -25_00,
      -75_00,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(invalidInput),
    ).rejects.toThrow('Amount must be absolute');
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const invalidInput = createGroupSheetTransactionInput(
      'EXPENSE',
      groupSheet.id,
      'GBP',
      user.id,
      user.id,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(invalidInput),
    ).rejects.toThrow('Currencies do not match');
  });

  it("returns 400 if the split currencies do doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    const input = createGroupSheetTransactionInput(
      'EXPENSE',
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      user.id,
    );

    input.splits[0]!.share.currencyCode = 'GBP';

    await expect(
      caller.transaction.createGroupSheetTransaction(input),
    ).rejects.toThrow('Currencies do not match');
  });

  it("returns 400 if shares don't add up to the total amount", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createGroupSheetTransactionInput(
      'EXPENSE',
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      user.id,
      +100_00,
      // total +200_00 split
      +100_00,
      +100_00,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(input),
    ).rejects.toThrow('Invalid splits');
  });

  it('returns 400 if split participants are not part of the groupSheet', async () => {
    const user = await userFactory(prisma);
    const otherUser = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createGroupSheetTransactionInput(
      'EXPENSE',
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      otherUser.id,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(input),
    ).rejects.toThrow('Invalid participants');
  });

  it('returns 404 if the groupSheet does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createGroupSheetTransaction(
        createGroupSheetTransactionInput(
          'EXPENSE',
          generateId(),
          currencyCodeFactory(),
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.createGroupSheetTransaction(
        createGroupSheetTransactionInput(
          'EXPENSE',
          groupSheet.id,
          groupSheet.currencyCode,
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('createGroupSheetSettlement', () => {
  it('creates an settlement', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const response = await caller.transaction.createGroupSheetSettlement({
      groupSheetId: groupSheet.id,
      money: {
        amount: 100_00,
        scale: 2,
        currencyCode: groupSheet.currencyCode,
      },
      fromId: user.id,
      toId: member.id,
    });

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const expense = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(expense).toMatchObject({
      type: TransactionType.TRANSFER,
    });

    expect(expense?.transactionEntries).toMatchObject([
      { scale: 2, amount: -100_00, userId: member.id },
      { scale: 2, amount: +100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the expense currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: 'EUR',
    });

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: groupSheet.id,
        money: { amount: 100_00, scale: 2, currencyCode: 'GBP' },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow('Currencies do not match');
  });

  it('returns 400 if the amount is negative', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: groupSheet.id,
        money: {
          amount: -100_00,
          scale: 2,
          currencyCode: groupSheet.currencyCode,
        },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow('Amount must be absolute');
  });

  it('returns 400 if participants are not part of the groupSheet', async () => {
    const [user, otherUser] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: groupSheet.id,
        money: {
          amount: 100_00,
          scale: 2,
          currencyCode: groupSheet.currencyCode,
        },
        fromId: user.id,
        toId: otherUser.id,
      }),
    ).rejects.toThrow('Invalid participants');
  });

  it('returns 404 if the groupSheet does not exist', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: generateId(),
        money: { amount: 100_00, scale: 2, currencyCode: 'EUR' },
        fromId: user.id,
        toId: member.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: groupSheet.id,
        money: {
          amount: 100_00,
          scale: 2,
          currencyCode: groupSheet.currencyCode,
        },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });
});

type Caller = ReturnType<typeof useProtectedCaller>;

describe('deleteExpense', () => {
  describe.each([
    [
      'personalSheet',
      personalSheetFactory,
      async (caller: Caller, personalSheet: Sheet) =>
        caller.transaction.createPersonalSheetTransaction(
          createPersonalSheetTransactionInput(
            personalSheet.id,
            personalSheet.currencyCode,
            'EXPENSE',
          ),
        ),
    ],
    [
      'groupSheet',
      groupSheetFactory,
      async (caller: Caller, groupSheet: Sheet, user: User) =>
        caller.transaction.createGroupSheetTransaction(
          createGroupSheetTransactionInput(
            'EXPENSE',
            groupSheet.id,
            groupSheet.currencyCode,
            user.id,
            user.id,
          ),
        ),
    ],
  ])('%s', (_sheetType, factory, createExpense) => {
    it('deletes an expense', async () => {
      const user = await userFactory(prisma);

      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      const expense = await createExpense(caller, sheet, user);

      await caller.transaction.deleteTransaction({
        sheetId: sheet.id,
        expenseId: expense.id,
      });

      expect(
        await prisma.transaction.findUnique({ where: { id: expense.id } }),
      ).toBeNull();
    });

    it('returns 404 if the user is not a member of the sheet', async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const otherSheetUser = await userFactory(prisma);
      const otherSheetCaller = useProtectedCaller(otherSheetUser);

      const sheet = await factory(prisma, {
        withOwnerId: otherSheetUser.id,
      });

      const expense = await createExpense(
        otherSheetCaller,
        sheet,
        otherSheetUser,
      );

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: sheet.id,
          expenseId: expense.id,
        }),
      ).rejects.toThrow('Sheet not found');
    });

    it('returns 404 if the expense is from another sheet', async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      const expense = await createExpense(caller, sheet, user);

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: generateId(),
          expenseId: expense.id,
        }),
      ).rejects.toThrow('Sheet not found');
    });

    it('returns 404 if the expense does not exist', async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: sheet.id,
          expenseId: generateId(),
        }),
      ).rejects.toThrow('Expense not found');
    });
  });
});

describe('getAllUserExpenses', () => {
  it.todo('returns expenses from all sheets');
});

describe('getGroupSheetExpenses', () => {
  it('returns all expenses for the groupSheet', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const expense = await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        'EXPENSE',
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        member.id,
      ),
    );

    const { transactions: expenses, total } =
      await caller.transaction.getGroupSheetTransactions({
        groupSheetId: groupSheet.id,
      });

    expect(expenses).toMatchObject([
      {
        id: expense.id,
        description: expense.description,
        participants: [
          { id: member.id, balance: { share: { amount: -75_00, scale: 2 } } },
          { id: user.id, balance: { share: { amount: -25_00, scale: 2 } } },
        ],
      },
    ]);

    expect(total).toBe(1);
  });

  it('returns 404 if the groupSheet does not exist', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.getGroupSheetTransactions({
        groupSheetId: generateId(),
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not a member of the groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.getGroupSheetTransactions({
        groupSheetId: groupSheet.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('getParticipantSummaries', () => {
  it('returns balance for each participant', async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const paidById = user.id;
    const otherId = member.id;

    await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        'EXPENSE',
        groupSheet.id,
        groupSheet.currencyCode,
        paidById,
        otherId,
      ),
    );

    await caller.transaction.createGroupSheetSettlement({
      groupSheetId: groupSheet.id,
      fromId: member.id,
      toId: user.id,
      money: { currencyCode: groupSheet.currencyCode, amount: 13_00, scale: 2 },
    });

    const summary = await caller.transaction.getParticipantSummaries(
      groupSheet.id,
    );

    expect(summary).toMatchObject([
      {
        balance: { amount: -62_00, scale: 2 },
        participantId: user.id,
        name: user.name,
      },
      {
        balance: { amount: 62_00, scale: 2 },
        participantId: member.id,
        name: member.name,
      },
    ]);
  });

  it('returns 404 if the groupSheet does not exist', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.getParticipantSummaries(generateId()),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns 404 if the user is not part of the groupSheet', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.getParticipantSummaries(groupSheet.id),
    ).rejects.toThrow('Sheet not found');
  });
});
