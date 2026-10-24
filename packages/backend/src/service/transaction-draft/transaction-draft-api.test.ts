import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from "../../../test/factories.ts";
import { getApiCaller } from "../../../test/get-api-caller.ts";
import {
  createGroupSheetTransactionInput,
  createPersonalSheetTransactionInput,
} from "../../../test/input.ts";

const { useProtectedCaller, prisma, betterAuth } = await getApiCaller();

describe("createAppleWalletDraft", () => {
  it("creates a draft with the parsed amount and raw input", async () => {
    const caller = useProtectedCaller(await userFactory(prisma, betterAuth));

    const body = {
      amount: "12,34 €",
      merchant: "Test",
      card: "Visa Kreditkarte",
      name: "Test",
      transaction: "Test",
    };

    const draft = await caller.transactionDraft.createAppleWalletDraft(body);

    expect(draft).toMatchObject({
      source: "APPLE_WALLET",
      description: "Test",
      money: { amount: 1234, scale: 2, currencyCode: "EUR" },
      rawInput: body,
    });
  });

  it("keeps the draft if the amount can't be parsed", async () => {
    const caller = useProtectedCaller(await userFactory(prisma, betterAuth));

    const draft = await caller.transactionDraft.createAppleWalletDraft({
      amount: "forty-two euros",
      merchant: "Lidl",
    });

    expect(draft).toMatchObject({ money: null, description: "Lidl" });
  });

  it("rejects a body without an amount", async () => {
    const caller = useProtectedCaller(await userFactory(prisma, betterAuth));

    await expect(
      caller.transactionDraft.createAppleWalletDraft({ merchant: "Lidl" }),
    ).rejects.toThrow(ZodError);
  });

  it("rejects unknown fields", async () => {
    const caller = useProtectedCaller(await userFactory(prisma, betterAuth));

    await expect(
      caller.transactionDraft.createAppleWalletDraft({
        amount: "12,34 €",
        other: "value",
      }),
    ).rejects.toThrow(ZodError);
  });
});

describe("getTransactionDrafts", () => {
  it("only returns the user's own drafts", async () => {
    const userA = await userFactory(prisma, betterAuth);
    const userB = await userFactory(prisma, betterAuth);

    await useProtectedCaller(userA).transactionDraft.createAppleWalletDraft({
      amount: "£12.50",
    });

    await expect(
      useProtectedCaller(userA).transactionDraft.getTransactionDrafts(),
    ).resolves.toMatchObject([
      { money: { amount: 1250, scale: 2, currencyCode: "GBP" } },
    ]);
    await expect(
      useProtectedCaller(userB).transactionDraft.getTransactionDrafts(),
    ).resolves.toStrictEqual([]);
  });
});

describe("deleteTransactionDraft", () => {
  it("deletes the user's own draft", async () => {
    const caller = useProtectedCaller(await userFactory(prisma, betterAuth));

    const draft = await caller.transactionDraft.createAppleWalletDraft({
      amount: "12,34 €",
    });

    await caller.transactionDraft.deleteTransactionDraft({ id: draft.id });

    await expect(
      caller.transactionDraft.getTransactionDrafts(),
    ).resolves.toStrictEqual([]);
  });

  it("does not delete another user's draft", async () => {
    const userA = await userFactory(prisma, betterAuth);
    const userB = await userFactory(prisma, betterAuth);

    const draft = await useProtectedCaller(
      userA,
    ).transactionDraft.createAppleWalletDraft({ amount: "12,34 €" });

    await expect(
      useProtectedCaller(userB).transactionDraft.deleteTransactionDraft({
        id: draft.id,
      }),
    ).rejects.toThrow("Draft not found");

    await expect(
      useProtectedCaller(userA).transactionDraft.getTransactionDrafts(),
    ).resolves.toHaveLength(1);
  });
});

describe("creating a transaction from a draft", () => {
  it("deletes the draft when creating a personal sheet transaction", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: userAndCookie.user.id,
    });
    const draft = await caller.transactionDraft.createAppleWalletDraft({
      amount: "12,34 €",
    });

    const { id } = await caller.transaction.createPersonalSheetTransaction({
      ...createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
      draftId: draft.id,
    });

    await expect(
      prisma.transaction.findUnique({ where: { id } }),
    ).resolves.not.toBeNull();
    await expect(
      caller.transactionDraft.getTransactionDrafts(),
    ).resolves.toStrictEqual([]);
  });

  it("deletes the draft when creating a group sheet transaction", async () => {
    const [userAndCookie, memberAndCookie] = await Promise.all([
      userFactory(prisma, betterAuth),
      userFactory(prisma, betterAuth),
    ]);
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: userAndCookie.user.id,
      withParticipantIds: [memberAndCookie.user.id],
    });
    const draft = await caller.transactionDraft.createAppleWalletDraft({
      amount: "12,34 €",
    });

    const { id } = await caller.transaction.createGroupSheetTransaction({
      ...createGroupSheetTransactionInput(
        "EXPENSE",
        groupSheet.id,
        groupSheet.currencyCode,
        userAndCookie.user.id,
        memberAndCookie.user.id,
      ),
      draftId: draft.id,
    });

    await expect(
      prisma.transaction.findUnique({ where: { id } }),
    ).resolves.not.toBeNull();
    await expect(
      caller.transactionDraft.getTransactionDrafts(),
    ).resolves.toStrictEqual([]);
  });

  it("does not create a transaction if the draft was already used", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: userAndCookie.user.id,
    });
    const draft = await caller.transactionDraft.createAppleWalletDraft({
      amount: "12,34 €",
    });

    const input = {
      ...createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
      draftId: draft.id,
    };

    await caller.transaction.createPersonalSheetTransaction(input);
    await expect(
      caller.transaction.createPersonalSheetTransaction(input),
    ).rejects.toThrow("Draft not found");

    await expect(
      prisma.transaction.count({ where: { sheetId: personalSheet.id } }),
    ).resolves.toBe(1);
  });

  it("does not create a transaction from another user's draft", async () => {
    const userA = await userFactory(prisma, betterAuth);
    const userB = await userFactory(prisma, betterAuth);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: userB.user.id,
    });
    const draft = await useProtectedCaller(
      userA,
    ).transactionDraft.createAppleWalletDraft({ amount: "12,34 €" });

    await expect(
      useProtectedCaller(userB).transaction.createPersonalSheetTransaction({
        ...createPersonalSheetTransactionInput(
          personalSheet.id,
          personalSheet.currencyCode,
          "EXPENSE",
        ),
        draftId: draft.id,
      }),
    ).rejects.toThrow("Draft not found");

    await expect(
      prisma.transaction.count({ where: { sheetId: personalSheet.id } }),
    ).resolves.toBe(0);
    await expect(
      useProtectedCaller(userA).transactionDraft.getTransactionDrafts(),
    ).resolves.toHaveLength(1);
  });
});
