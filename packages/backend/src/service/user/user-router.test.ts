import { describe, expect, it, vi } from "vitest";

import { personalSheetFactory, userFactory } from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/get-trpc-caller.ts";
import { createPersonalSheetTransactionInput } from "../../../test/input.ts";

const { usePublicCaller, useProtectedCaller, prisma, betterAuth } =
  await getTRPCCaller();

describe("signOut", () => {
  it("signs a user out", async () => {
    const clearSiteData = vi.fn();

    const caller = usePublicCaller({ clearSiteData });

    await caller.user.signOut();
    expect(clearSiteData).toHaveBeenCalledExactlyOnceWith();
  });
});

describe("anonymizeUser", () => {
  it("anonymizes a user", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie, {});

    const deletedUserId = await caller.user.anonymizeUser();

    expect(deletedUserId).toBe(user.id);

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deletedUser).toMatchObject({
      id: user.id,
      name: "Deleted User",
      email: expect.stringMatching(/^deleted_.+@example.com$/),
    });
  });

  it("clears site data", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);

    const clearSiteData = vi.fn();
    const caller = useProtectedCaller(userAndCookie, { clearSiteData });

    await caller.user.anonymizeUser();

    expect(clearSiteData).toHaveBeenCalledExactlyOnceWith();
  });

  it("deletes personal sheets and transactions", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const caller = useProtectedCaller(userAndCookie, {});

    const transaction = await caller.transaction.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        "EXPENSE",
      ),
    );

    await caller.user.anonymizeUser();

    await expect(
      prisma.sheet.findFirst({
        where: { id: personalSheet.id },
      }),
    ).resolves.toBeNull();

    await expect(
      prisma.transaction.findFirst({ where: { id: transaction.id } }),
    ).resolves.toBeNull();
  });
});
