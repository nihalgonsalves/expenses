import { TransactionType } from "@prisma/client";
import type { DeepPartial } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import {
  currencyCodeFactory,
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/getTRPCCaller.ts";
import {
  createGroupSheetTransactionInput,
  createPersonalSheetTransactionInput,
  createPersonalSheetTransactionScheduleInput,
} from "../../../test/input.ts";
import { generateId } from "../../utils/nanoid.ts";

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe("createPersonalSheetTransaction", () => {
  it.each([
    ["EXPENSE", -100_00],
    ["INCOME", 100_00],
  ] as const)("creates an %s transaction", async (type, amount) => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const response = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        type,
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(transaction).toMatchObject({
      type,
    });

    expect(transaction?.transactionEntries).toMatchObject([
      { scale: 2, amount, userId: user.id },
    ]);
  });

  it("returns 400 if the transaction currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      "GBP",
      "EXPENSE",
    );

    await expect(
      caller.transaction.createPersonalSheetTransaction(invalidInput),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 404 if the personalSheet does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createPersonalSheetTransaction(
        createPersonalSheetTransactionInput(
          generateId(),
          currencyCodeFactory(),
          "EXPENSE",
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not the personalSheet owner", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.transaction.createPersonalSheetTransaction(
        createPersonalSheetTransactionInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("updatePersonalSheetTransaction", () => {
  it.each([
    ["EXPENSE", -50_00],
    ["INCOME", 50_00],
  ] as const)("updates an %s transaction", async (type, amount) => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const { id } = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        type,
      ),
    );

    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    const response = await caller.transaction.updatePersonalSheetTransaction({
      id,
      ...createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        type,
        Math.abs(amount),
      ),
    });

    expect(response).toMatchObject({
      id,
    });

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(updatedTransaction).toMatchObject({
      id,
      type,
      createdAt: originalTransaction?.createdAt,
    });

    expect(updatedTransaction?.transactionEntries).toMatchObject([
      { scale: 2, amount, userId: user.id },
    ]);
  });

  it("returns 400 if the transaction currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const { id } = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
    );

    const invalidInput = {
      id,
      ...createPersonalSheetTransactionInput(
        personalSheet.id,
        "GBP",
        "EXPENSE",
      ),
    };

    await expect(
      caller.transaction.updatePersonalSheetTransaction(invalidInput),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 404 if the transaction does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    await expect(
      caller.transaction.updatePersonalSheetTransaction({
        id: generateId(),
        ...createPersonalSheetTransactionInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
      }),
    ).rejects.toThrow("Transaction not found");
  });

  it("returns 404 if the personalSheet does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.updatePersonalSheetTransaction({
        id: generateId(),
        ...createPersonalSheetTransactionInput(
          generateId(),
          currencyCodeFactory(),
          "EXPENSE",
        ),
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not the personalSheet owner", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.transaction.updatePersonalSheetTransaction({
        id: generateId(),
        ...createPersonalSheetTransactionInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
      }),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("createPersonalSheetTransactionSchedule", () => {
  it.each([
    ["EXPENSE", -100_00],
    ["INCOME", 100_00],
  ] as const)(
    "creates an %s transaction schedule",
    async (type, expectedAmount) => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const personalSheet = await personalSheetFactory(prisma, {
        withOwnerId: user.id,
      });

      const response =
        await caller.transaction.createPersonalSheetTransactionSchedule(
          createPersonalSheetTransactionScheduleInput(
            personalSheet.id,
            personalSheet.currencyCode,
            type,
          ),
        );

      expect(response).toMatchObject({
        id: expect.any(String),
      });

      const transaction = await prisma.transactionSchedule.findUnique({
        where: { id: response.id },
      });

      expect(transaction).toMatchObject({
        id: response.id,
        type,
        sheetId: personalSheet.id,
        category: "other",
        description: expect.stringMatching(/test personal (income|expense)/),
        amount: expectedAmount,
        scale: 2,
        nextOccurrenceAt: expect.any(Date),
        nextOccurrenceTzId: expect.any(String),
        rruleFreq: "MONTHLY",
      });
    },
  );

  it("returns 400 if the transaction currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const invalidInput = createPersonalSheetTransactionScheduleInput(
      personalSheet.id,
      "GBP",
      "EXPENSE",
    );

    await expect(
      caller.transaction.createPersonalSheetTransactionSchedule(invalidInput),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 404 if the personalSheet does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          generateId(),
          currencyCodeFactory(),
          "EXPENSE",
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not the personalSheet owner", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("batchCreatePersonalSheetTransactions", () => {
  it("creates transactions", async () => {
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
          "EXPENSE",
        ),
      ],
    });

    const transaction = await prisma.transaction.findFirst({
      include: { transactionEntries: true },
    });

    expect(transaction).toMatchObject({
      type: TransactionType.EXPENSE,
    });

    expect(transaction?.transactionEntries).toMatchObject([
      { scale: 2, amount: -100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the transactions currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      "GBP",
      "EXPENSE",
    );

    await expect(
      caller.transaction.batchCreatePersonalSheetTransactions({
        personalSheetId: personalSheet.id,
        transactions: [invalidInput],
      }),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 400 if the amount isn't absolute", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const invalidInput = createPersonalSheetTransactionInput(
      personalSheet.id,
      personalSheet.currencyCode,
      "EXPENSE",
      -100_00,
    );

    await expect(
      caller.transaction.batchCreatePersonalSheetTransactions({
        personalSheetId: personalSheet.id,
        transactions: [invalidInput],
      }),
    ).rejects.toThrow("Amount must be absolute");
  });

  it.todo("returns 404 if the personalSheet does not exist");

  it.todo("returns 404 if the user is not the personalSheet owner");
});

describe("createGroupSheetTransaction", () => {
  it("creates an expense transaction", async () => {
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
        "EXPENSE",
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        member.id,
      ),
    );

    expect(response).toMatchObject({
      id: expect.any(String),
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(transaction).toMatchObject({
      type: TransactionType.EXPENSE,
    });

    expect(transaction?.transactionEntries).toMatchObject([
      { scale: 2, amount: -75_00, userId: member.id },
      { scale: 2, amount: +75_00, userId: user.id },
      { scale: 2, amount: -25_00, userId: user.id },
      { scale: 2, amount: +25_00, userId: user.id },
    ]);
  });

  it("creates an income transaction", async () => {
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
        "INCOME",
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

    const transaction = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(transaction).toMatchObject({
      type: TransactionType.INCOME,
    });

    expect(transaction?.transactionEntries).toMatchObject([
      { scale: 2, amount: +75_00, userId: member.id },
      { scale: 2, amount: -75_00, userId: user.id },
      { scale: 2, amount: +25_00, userId: user.id },
      { scale: 2, amount: -25_00, userId: user.id },
    ]);
  });

  it("returns 400 if the amount is not absolute", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const invalidInput = createGroupSheetTransactionInput(
      "EXPENSE",
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
    ).rejects.toThrow("Amount must be absolute");
  });

  it("returns 400 if the transaction currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const invalidInput = createGroupSheetTransactionInput(
      "EXPENSE",
      groupSheet.id,
      "GBP",
      user.id,
      user.id,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(invalidInput),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 400 if the split currencies do doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    const input = createGroupSheetTransactionInput(
      "EXPENSE",
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      user.id,
    );

    input.splits[0]!.share.currencyCode = "GBP";

    await expect(
      caller.transaction.createGroupSheetTransaction(input),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 400 if shares don't add up to the total amount", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createGroupSheetTransactionInput(
      "EXPENSE",
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
    ).rejects.toThrow("Invalid splits");
  });

  it("returns 400 if split participants are not part of the groupSheet", async () => {
    const user = await userFactory(prisma);
    const otherUser = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const input = createGroupSheetTransactionInput(
      "EXPENSE",
      groupSheet.id,
      groupSheet.currencyCode,
      user.id,
      otherUser.id,
    );

    await expect(
      caller.transaction.createGroupSheetTransaction(input),
    ).rejects.toThrow("Invalid participants");
  });

  it("returns 404 if the groupSheet does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createGroupSheetTransaction(
        createGroupSheetTransactionInput(
          "EXPENSE",
          generateId(),
          currencyCodeFactory(),
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not a member of the groupSheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.createGroupSheetTransaction(
        createGroupSheetTransactionInput(
          "EXPENSE",
          groupSheet.id,
          groupSheet.currencyCode,
          user.id,
          user.id,
        ),
      ),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("createGroupSheetSettlement", () => {
  it("creates an settlement", async () => {
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

    const transaction = await prisma.transaction.findUnique({
      where: { id: response.id },
      include: { transactionEntries: true },
    });

    expect(transaction).toMatchObject({
      type: TransactionType.TRANSFER,
    });

    expect(transaction?.transactionEntries).toMatchObject([
      { scale: 2, amount: -100_00, userId: member.id },
      { scale: 2, amount: +100_00, userId: user.id },
    ]);
  });

  it("returns 400 if the transaction currency doesn't match", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      currencyCode: "EUR",
    });

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: groupSheet.id,
        money: { amount: 100_00, scale: 2, currencyCode: "GBP" },
        fromId: user.id,
        toId: user.id,
      }),
    ).rejects.toThrow("Currencies do not match");
  });

  it("returns 400 if the amount is negative", async () => {
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
    ).rejects.toThrow("Amount must be absolute");
  });

  it("returns 400 if participants are not part of the groupSheet", async () => {
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
    ).rejects.toThrow("Invalid participants");
  });

  it("returns 404 if the groupSheet does not exist", async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.createGroupSheetSettlement({
        groupSheetId: generateId(),
        money: { amount: 100_00, scale: 2, currencyCode: "EUR" },
        fromId: user.id,
        toId: member.id,
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not a member of the groupSheet", async () => {
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
    ).rejects.toThrow("Sheet not found");
  });
});

type Caller = ReturnType<typeof useProtectedCaller>;

describe("deleteTransaction", () => {
  describe.each([
    [
      "personalSheet",
      personalSheetFactory,
      async (caller: Caller, personalSheet: Sheet) =>
        caller.transaction.createPersonalSheetTransaction(
          createPersonalSheetTransactionInput(
            personalSheet.id,
            personalSheet.currencyCode,
            "EXPENSE",
          ),
        ),
    ],
    [
      "groupSheet",
      groupSheetFactory,
      async (caller: Caller, groupSheet: Sheet, user: User) =>
        caller.transaction.createGroupSheetTransaction(
          createGroupSheetTransactionInput(
            "EXPENSE",
            groupSheet.id,
            groupSheet.currencyCode,
            user.id,
            user.id,
          ),
        ),
    ],
  ])("%s", (_sheetType, factory, createTransaction) => {
    it("deletes an transaction", async () => {
      const user = await userFactory(prisma);

      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      const transaction = await createTransaction(caller, sheet, user);

      await caller.transaction.deleteTransaction({
        sheetId: sheet.id,
        transactionId: transaction.id,
      });

      await expect(
        prisma.transaction.findUnique({ where: { id: transaction.id } }),
      ).resolves.toBeNull();
    });

    it("returns 404 if the user is not a member of the sheet", async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const otherSheetUser = await userFactory(prisma);
      const otherSheetCaller = useProtectedCaller(otherSheetUser);

      const sheet = await factory(prisma, {
        withOwnerId: otherSheetUser.id,
      });

      const transaction = await createTransaction(
        otherSheetCaller,
        sheet,
        otherSheetUser,
      );

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: sheet.id,
          transactionId: transaction.id,
        }),
      ).rejects.toThrow("Sheet not found");
    });

    it("returns 404 if the transaction is from another sheet", async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      const transaction = await createTransaction(caller, sheet, user);

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: generateId(),
          transactionId: transaction.id,
        }),
      ).rejects.toThrow("Sheet not found");
    });

    it("returns 404 if the transaction does not exist", async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);

      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      await expect(
        caller.transaction.deleteTransaction({
          sheetId: sheet.id,
          transactionId: generateId(),
        }),
      ).rejects.toThrow("Transaction not found");
    });
  });
});

describe("deleteTransactionSchedule", () => {
  it("deletes an transaction schedule", async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

    const sheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const transactionSchedule =
      await caller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          sheet.id,
          sheet.currencyCode,
          "EXPENSE",
        ),
      );

    await caller.transaction.deleteTransactionSchedule({
      sheetId: sheet.id,
      transactionScheduleId: transactionSchedule.id,
    });

    await expect(
      prisma.transaction.findUnique({
        where: { id: transactionSchedule.id },
      }),
    ).resolves.toBeNull();
  });

  it("returns 404 if the user is not a member of the sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherSheetUser = await userFactory(prisma);
    const otherSheetCaller = useProtectedCaller(otherSheetUser);

    const sheet = await personalSheetFactory(prisma, {
      withOwnerId: otherSheetUser.id,
    });

    const transactionSchedule =
      await otherSheetCaller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          sheet.id,
          sheet.currencyCode,
          "EXPENSE",
        ),
      );

    await expect(
      caller.transaction.deleteTransactionSchedule({
        sheetId: sheet.id,
        transactionScheduleId: transactionSchedule.id,
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the transaction is from another sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const sheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const transactionSchedule =
      await caller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          sheet.id,
          sheet.currencyCode,
          "EXPENSE",
        ),
      );

    await expect(
      caller.transaction.deleteTransactionSchedule({
        sheetId: generateId(),
        transactionScheduleId: transactionSchedule.id,
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the transaction does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const sheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.transaction.deleteTransactionSchedule({
        sheetId: sheet.id,
        transactionScheduleId: generateId(),
      }),
    ).rejects.toThrow("Transaction schedule not found");
  });
});

describe("getTransaction", () => {
  it("returns a transaction", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const { id } = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
    );

    await expect(
      caller.transaction.getTransaction({
        sheetId: personalSheet.id,
        transactionId: id,
      }),
    ).resolves.toMatchObject({
      id,
    });
  });

  it("returns 404 if the transaction does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await expect(
      caller.transaction.getTransaction({
        sheetId: personalSheet.id,
        transactionId: generateId(),
      }),
    ).rejects.toThrow("Transaction not found");
  });

  it.todo("returns 404 if the personalSheet does not exist");

  it.todo("returns 404 if the user is not the personalSheet owner");
});

describe("getAllUserTransactions", () => {
  it("returns transactions from all sheets", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const member = await userFactory(prisma);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    await Promise.all(
      (["EXPENSE", "INCOME"] as const).map(async (type) => {
        await caller.transaction.createPersonalSheetTransaction(
          createPersonalSheetTransactionInput(
            personalSheet.id,
            personalSheet.currencyCode,
            type,
          ),
        );

        await caller.transaction.createGroupSheetTransaction(
          createGroupSheetTransactionInput(
            type,
            groupSheet.id,
            groupSheet.currencyCode,
            user.id,
            member.id,
          ),
        );
      }),
    );

    const result = await caller.transaction.getAllUserTransactions({
      fromTimestamp: Temporal.Now.instant().subtract({ minutes: 1 }).toString(),
      toTimestamp: Temporal.Now.instant().add({ minutes: 1 }).toString(),
    });

    expect(
      result.find(({ description }) => description === "test group expense"),
    ).toMatchObject({
      type: "EXPENSE",
      category: "other",
      description: "test group expense",
      money: {
        amount: -2500,
        scale: 2,
      },
      sheet: {
        type: "GROUP",
      },
    });

    expect(
      result.find(({ description }) => description === "test group income"),
    ).toMatchObject({
      type: "INCOME",
      category: "other",
      description: "test group income",
      money: {
        amount: 2500,
        scale: 2,
      },
      sheet: {
        type: "GROUP",
      },
    });

    expect(
      result.find(({ description }) => description === "test personal expense"),
    ).toMatchObject({
      type: "EXPENSE",
      category: "other",
      description: "test personal expense",
      money: {
        amount: -10000,
        scale: 2,
      },
      sheet: {
        type: "PERSONAL",
      },
    });

    expect(
      result.find(({ description }) => description === "test personal income"),
    ).toMatchObject({
      type: "INCOME",
      category: "other",
      description: "test personal income",
      money: {
        amount: 10000,
        scale: 2,
      },
      sheet: {
        type: "PERSONAL",
      },
    });
  });
});

describe("getPersonalSheetTransactions", () => {
  it("returns personal sheet transactions", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const { id } = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
    );

    const response = await caller.transaction.getPersonalSheetTransactions({
      personalSheetId: personalSheet.id,
    });

    expect(response).toMatchObject<typeof response>({
      total: 1,
      transactions: [
        {
          id,
          type: "EXPENSE",
          category: "other",
          description: "test personal expense",
          money: {
            amount: -100_00,
            scale: 2,
            currencyCode: personalSheet.currencyCode,
          },
          spentAt: expect.any(String),
        },
      ],
    });
  });

  it.todo("returns 404 if the personalSheet does not exist");

  it.todo("returns 404 if the user is not the personalSheet owner");
});

describe("getPersonalSheetTransactionSchedules", () => {
  it("returns personal sheet transaction schedules", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const { id } =
      await caller.transaction.createPersonalSheetTransactionSchedule(
        createPersonalSheetTransactionScheduleInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
      );

    const response =
      await caller.transaction.getPersonalSheetTransactionSchedules({
        personalSheetId: personalSheet.id,
      });

    expect(response).toMatchObject<typeof response>([
      {
        id,
        type: "EXPENSE",
        category: "other",
        description: "test personal expense",
        money: {
          amount: -100_00,
          scale: 2,
          currencyCode: personalSheet.currencyCode,
        },
        nextOccurrenceAt: expect.any(String),
        recurrenceRule: {
          freq: "MONTHLY",
        },
      },
    ]);
  });

  it.todo("returns 404 if the personalSheet does not exist");

  it.todo("returns 404 if the user is not the personalSheet owner");
});

describe("getGroupSheetTransactions", () => {
  it("returns all transactions for the groupSheet", async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    const transaction = await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        "EXPENSE",
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        member.id,
      ),
    );

    const { transactions, total } =
      await caller.transaction.getGroupSheetTransactions({
        groupSheetId: groupSheet.id,
      });

    expect(transactions).toMatchObject([
      {
        id: transaction.id,
        description: transaction.description,
        participants: [
          { id: member.id, balance: { share: { amount: -75_00, scale: 2 } } },
          { id: user.id, balance: { share: { amount: -25_00, scale: 2 } } },
        ],
      },
    ]);

    expect(total).toBe(1);
  });

  it("returns 404 if the groupSheet does not exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.getGroupSheetTransactions({
        groupSheetId: generateId(),
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not a member of the groupSheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.getGroupSheetTransactions({
        groupSheetId: groupSheet.id,
      }),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("getParticipantSummaries", () => {
  it("returns balance for each participant", async () => {
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
        "EXPENSE",
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

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    expect(summary).toMatchObject<DeepPartial<typeof summary>>([
      {
        balance: { amount: -62_00, scale: 2 },
        id: user.id,
        name: user.name,
      },
      {
        balance: { amount: 62_00, scale: 2 },
        id: member.id,
        name: member.name,
      },
    ]);
  });

  it("returns 404 if the groupSheet does not exist", async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

    await expect(
      caller.transaction.getParticipantSummaries(generateId()),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns 404 if the user is not part of the groupSheet", async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.transaction.getParticipantSummaries(groupSheet.id),
    ).rejects.toThrow("Sheet not found");
  });
});

describe("getCategories / setCategoryEmojiShortCode", () => {
  it("returns all transaction categories with user-set emoji", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
    );

    await caller.transaction.setCategoryEmojiShortCode({
      id: "other",
      emojiShortCode: ":+1:",
    });

    await expect(caller.transaction.getCategories()).resolves.toMatchObject([
      {
        id: "other",
        emojiShortCode: ":+1:",
      },
    ]);
  });
});
