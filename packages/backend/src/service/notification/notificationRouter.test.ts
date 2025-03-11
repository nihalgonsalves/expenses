import { describe, expect, it } from "vitest";

import { userFactory } from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/getTRPCCaller.ts";

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe("getPublicKey", () => {
  it("returns the server public key", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    expect(await caller.notification.getPublicKey()).toEqual("<public-key>");
  });
});

const args = {
  pushSubscription: {
    endpoint: "https://push.example.com/foo/bar",
    keys: {
      auth: "<auth-key>",
      p256dh: "<p256dh-key>",
    },
  },
};

const expected = {
  id: expect.any(String),
  description: "Macintosh (Safari)",
  endpoint: "https://push.example.com/foo/bar",
};

describe("getSubscriptions", () => {
  it("returns all user subscriptions", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await caller.notification.upsertSubscription(args);
    expect(await caller.notification.getSubscriptions()).toEqual([expected]);
  });
});

describe("upsertSubscription", () => {
  it("creates a subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    expect(await caller.notification.upsertSubscription(args)).toEqual(
      expected,
    );
  });

  it("updates an existing subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const firstResult = await caller.notification.upsertSubscription(args);
    expect(firstResult).toEqual(expected);

    const secondResult = await caller.notification.upsertSubscription(args);
    expect(secondResult).toEqual(expected);

    expect(firstResult.id).toBe(secondResult.id);
  });
});

describe("deleteSubscription", () => {
  it("deletes a subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const { id } = await caller.notification.upsertSubscription(args);

    await caller.notification.deleteSubscription(id);

    expect(
      await prisma.notificationSubscription.findUnique({ where: { id } }),
    ).toBe(null);
  });
});
