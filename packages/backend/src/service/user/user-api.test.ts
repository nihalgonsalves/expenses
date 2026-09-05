import { describe, expect, it, vi } from "vitest";

import { personalSheetFactory, userFactory } from "../../../test/factories.ts";
import { getApiCaller } from "../../../test/get-api-caller.ts";
import { createPersonalSheetTransactionInput } from "../../../test/input.ts";

const { usePublicCaller, useProtectedCaller, prisma, betterAuth } =
  await getApiCaller();

describe("signOut", () => {
  it("signs a user out", async () => {
    const clearSiteData = vi.fn<() => void>();

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

    const clearSiteData = vi.fn<() => void>();
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

describe("category groups", () => {
  it("creates, updates, and deletes a user's category group", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie, {});

    const created = await caller.user.createCategoryGroup({
      name: "Food",
      categories: ["Eating Out", "Work Lunch"],
    });

    await expect(caller.user.getCategoryGroups()).resolves.toMatchObject([
      {
        id: created.id,
        name: "Food",
        categories: ["Eating Out", "Work Lunch"],
      },
    ]);

    await caller.user.updateCategoryGroup({
      id: created.id,
      name: "Meals",
      categories: ["Eating Out"],
    });

    await caller.user.deleteCategoryGroup(created.id);
    await expect(caller.user.getCategoryGroups()).resolves.toEqual([]);
  });

  it("does not let a category belong to two groups for the same user", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie, {});

    await caller.user.createCategoryGroup({
      name: "Food",
      categories: ["Groceries"],
    });

    await expect(
      caller.user.createCategoryGroup({
        name: "Home",
        categories: ["Groceries"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
