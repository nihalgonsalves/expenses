import { describe, expect, it } from "vitest";

import { userFactory } from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/getTRPCCaller.ts";

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe("getPublicKey", () => {
  it("returns the server public key", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.notification.getPublicKey()).resolves.toBe(
      "<public-key>",
    );
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
    await expect(caller.notification.getSubscriptions()).resolves.toStrictEqual(
      [expected],
    );
  });
});

describe("upsertSubscription", () => {
  it("creates a subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.notification.upsertSubscription(args),
    ).resolves.toStrictEqual(expected);
  });

  it("updates an existing subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const firstResult = await caller.notification.upsertSubscription(args);
    expect(firstResult).toStrictEqual(expected);

    const secondResult = await caller.notification.upsertSubscription(args);
    expect(secondResult).toStrictEqual(expected);

    expect(firstResult.id).toBe(secondResult.id);
  });
});

describe("deleteSubscription", () => {
  it("deletes a subscription", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const { id } = await caller.notification.upsertSubscription(args);

    await caller.notification.deleteSubscription(id);

    await expect(
      prisma.notificationSubscription.findUnique({ where: { id } }),
    ).resolves.toBeNull();
  });
});
