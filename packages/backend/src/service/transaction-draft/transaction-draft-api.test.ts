import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { userFactory } from "../../../test/factories.ts";
import { getApiCaller } from "../../../test/get-api-caller.ts";

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
