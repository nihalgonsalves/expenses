import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";

import {
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/get-trpc-caller.ts";
import { createGroupSheetTransactionInput } from "../../../test/input.ts";
import { SheetParticipantRole } from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";

const { prisma, betterAuth, useProtectedCaller } = await getTRPCCaller();

describe("createPersonalSheet", () => {
  it("creates a sheet", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await caller.sheet.createPersonalSheet({
      name: "Personal Expenses",
      currencyCode: "EUR",
    });

    expect(personalSheet).toStrictEqual({
      id: expect.any(String),
      type: "PERSONAL",
      name: "Personal Expenses",
      currencyCode: "EUR",
      isArchived: false,
    });
  });
});

describe("createGroupSheet", () => {
  it("creates a groupSheet", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await caller.sheet.createGroupSheet({
      name: "WG Expenses",
      currencyCode: "EUR",
    });

    expect(groupSheet).toStrictEqual({
      id: expect.any(String),
      type: "GROUP",
      name: "WG Expenses",
      currencyCode: "EUR",
      isArchived: false,
      participants: expect.arrayContaining([
        {
          id: user.id,
        },
      ]),
    });
  });
});

describe("personalSheetById", () => {
  it("returns a sheet", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const sheetById = await caller.sheet.personalSheetById(personalSheet.id);

    expect(sheetById).toStrictEqual({
      id: personalSheet.id,
      type: "PERSONAL",
      name: personalSheet.name,
      currencyCode: personalSheet.currencyCode,
      isArchived: false,
    });
  });

  it("returns a 404 if it doesn't exist", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    await expect(caller.sheet.personalSheetById(generateId())).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 if it is not the user's sheet", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.sheet.personalSheetById(personalSheet.id),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns a 404 for a groupSheet ID", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.personalSheetById(groupSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });
});

describe("groupSheetById", () => {
  it("returns a groupSheet", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const groupSheetById = await caller.sheet.groupSheetById(groupSheet.id);

    expect(groupSheetById).toStrictEqual({
      id: groupSheet.id,
      type: "GROUP",
      name: groupSheet.name,
      currencyCode: groupSheet.currencyCode,
      isArchived: false,
      participants: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: SheetParticipantRole.ADMIN,
        },
      ],
    });
  });

  it("returns a 404 if it doesn't exist", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    await expect(caller.sheet.groupSheetById(generateId())).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 if the participant has no access", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(groupSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 for a personal sheet ID", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(personalSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });
});

describe("mySheets", () => {
  it("returns all personal sheets", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie);
    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await Promise.all([
      // otherPersonalSheet
      personalSheetFactory(prisma),
      // otherGroupSheet
      groupSheetFactory(prisma),
    ]);

    const mySheets = await caller.sheet.mySheets({ includeArchived: true });
    expect(mySheets).toMatchObject([{ id: personalSheet.id }]);
  });

  it("hides archived sheets when includeArchived is false", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie);

    await Promise.all([
      personalSheetFactory(prisma, {
        withOwnerId: user.id,
        isArchived: true,
      }),
      groupSheetFactory(prisma, {
        withOwnerId: user.id,
        isArchived: true,
      }),
    ]);

    const mySheets = await caller.sheet.mySheets({ includeArchived: false });
    expect(mySheets).toHaveLength(0);

    const allMySheets = await caller.sheet.mySheets({ includeArchived: true });
    expect(allMySheets).toHaveLength(2);
  });

  it("returns all groups where the user is a participant", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie);
    const ownedGroupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const participatingGroupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });
    const otherGroupSheet = await groupSheetFactory(prisma);

    const mySheets = await caller.sheet.mySheets({ includeArchived: true });

    expect(mySheets).toHaveLength(2);

    expect(mySheets.find(({ id }) => id === ownedGroupSheet.id)).toBeDefined();
    expect(
      mySheets.find(({ id }) => id === participatingGroupSheet.id),
    ).toBeDefined();
    expect(
      mySheets.find(({ id }) => id === otherGroupSheet.id),
    ).toBeUndefined();
  });
});

describe("updateSheet", () => {
  describe.each([
    ["personalSheet", personalSheetFactory],
    ["groupSheet", groupSheetFactory],
  ])("%s", (sheetType, factory) => {
    it(`updates a ${sheetType}`, async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const user = userAndCookie.user;
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      await caller.sheet.updateSheet({ id: sheet.id, name: "Updated sheet" });

      await expect(
        prisma.sheet.findUnique({ where: { id: sheet.id } }),
      ).resolves.toMatchObject({ name: "Updated sheet" });
    });

    it("returns a 404 if the participant has no access", async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma);

      await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
        "Sheet not found",
      );
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const userAndCookie = await userFactory(prisma, betterAuth);
        const user = userAndCookie.user;
        const caller = useProtectedCaller(userAndCookie);
        const sheet = await factory(prisma, {
          withParticipantIds: [user.id],
        });

        await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
          "Only admins can delete sheets",
        );
      });
    }
  });
});

describe("deleteSheet", () => {
  describe.each([
    ["personalSheet", personalSheetFactory],
    ["groupSheet", groupSheetFactory],
  ])("%s", (sheetType, factory) => {
    it(`deletes a ${sheetType}`, async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const user = userAndCookie.user;
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      await caller.sheet.deleteSheet(sheet.id);

      await expect(
        prisma.sheet.findUnique({ where: { id: sheet.id } }),
      ).resolves.toBeNull();
    });

    it.todo(`deletes a ${sheetType} with transactions`);

    it("returns a 404 if the participant has no access", async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma);

      await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
        "Sheet not found",
      );
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const userAndCookie = await userFactory(prisma, betterAuth);
        const user = userAndCookie.user;
        const caller = useProtectedCaller(userAndCookie);
        const sheet = await factory(prisma, {
          withParticipantIds: [user.id],
        });

        await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
          "Only admins can delete sheets",
        );
      });
    }
  });
});

describe("archiveSheet", () => {
  describe.each([
    ["personalSheet", personalSheetFactory],
    ["groupSheet", groupSheetFactory],
  ])("%s", (sheetType, factory) => {
    it(`archives and unarchives a ${sheetType}`, async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const user = userAndCookie.user;
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      for (const isArchived of [true, false]) {
        await caller.sheet.archiveSheet({ sheetId: sheet.id, isArchived });

        await expect(
          prisma.sheet.findUnique({ where: { id: sheet.id } }),
        ).resolves.toMatchObject({ isArchived });
      }
    });

    it.todo(`archives and unarchives a ${sheetType} with transactions`);

    it("returns a 404 if the participant has no access", async () => {
      const userAndCookie = await userFactory(prisma, betterAuth);
      const caller = useProtectedCaller(userAndCookie);
      const sheet = await factory(prisma);

      await expect(
        caller.sheet.archiveSheet({ sheetId: sheet.id, isArchived: true }),
      ).rejects.toThrow("Sheet not found");
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const userAndCookie = await userFactory(prisma, betterAuth);
        const user = userAndCookie.user;
        const caller = useProtectedCaller(userAndCookie);
        const sheet = await factory(prisma, {
          withParticipantIds: [user.id],
        });

        await expect(
          caller.sheet.archiveSheet({ sheetId: sheet.id, isArchived: true }),
        ).rejects.toThrow("Only admins can archive sheets");
      });
    }
  });
});

describe("addGroupSheetMember", () => {
  it("adds a member", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const { user: otherUser } = await userFactory(prisma, betterAuth);

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        name: otherUser.name,
        email: otherUser.email,
      }),
    ).resolves.toMatchObject({
      id: otherUser.id,
      name: otherUser.name,
      email: otherUser.email,
      role: SheetParticipantRole.MEMBER,
    });
  });

  it("creates a new user if the member is not signed up", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const participantEmail = "jessica@example.com";

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        name: "Jessica",
        email: participantEmail,
      }),
    ).resolves.toMatchObject({
      id: expect.any(String),
      name: "Jessica",
      email: participantEmail,
      role: SheetParticipantRole.MEMBER,
    });
  });

  it("returns a 409 for an existing participant", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);

    const { user: otherUser } = await userFactory(prisma, betterAuth);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [otherUser.id],
    });

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        name: otherUser.name,
        email: otherUser.email,
      }),
    ).rejects.toThrow("Participant already exists");
  });

  it("returns a 404 if the participant has no access", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        name: faker.person.fullName(),
        email: faker.internet.email(),
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns a 403 if the participant is not an admin", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;
    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        name: faker.person.fullName(),
        email: faker.internet.email(),
      }),
    ).rejects.toThrow("Only admins can add participants");
  });
});

describe("deleteParticipant", () => {
  it("deletes a participant as admin", async () => {
    const [userAndCookie, memberWithToken] = await Promise.all([
      userFactory(prisma, betterAuth),
      userFactory(prisma, betterAuth),
    ]);
    const user = userAndCookie.user;
    const member = memberWithToken.user;

    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    await caller.sheet.deleteGroupSheetMember({
      groupSheetId: groupSheet.id,
      participantId: member.id,
    });

    await expect(
      prisma.sheetMemberships.findUnique({
        where: {
          sheetMembership: {
            participantId: member.id,
            sheetId: groupSheet.id,
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("leaves as a participant", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await caller.sheet.deleteGroupSheetMember({
      groupSheetId: groupSheet.id,
      participantId: user.id,
    });

    await expect(
      prisma.sheetMemberships.findUnique({
        where: {
          sheetMembership: {
            participantId: user.id,
            sheetId: groupSheet.id,
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("leaves as a participant with settled balance", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const user = userAndCookie.user;

    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    // Paid for self, so settled de-facto
    await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        "EXPENSE",
        groupSheet.id,
        groupSheet.currencyCode,
        user.id,
        user.id,
      ),
    );

    await caller.sheet.deleteGroupSheetMember({
      groupSheetId: groupSheet.id,
      participantId: user.id,
    });

    await expect(
      prisma.sheetMemberships.findUnique({
        where: {
          sheetMembership: {
            participantId: user.id,
            sheetId: groupSheet.id,
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("returns a 400 if the admin tries to remove themselves", async () => {
    const adminWithToken = await userFactory(prisma, betterAuth);
    const admin = adminWithToken.user;

    const caller = useProtectedCaller(adminWithToken);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: admin.id,
    });

    await expect(
      caller.sheet.deleteGroupSheetMember({
        groupSheetId: groupSheet.id,
        participantId: admin.id,
      }),
    ).rejects.toThrow("You cannot delete yourself as the last admin");
  });

  it("returns a 400 if the participant's balance is non zero", async () => {
    const [adminWithToken, memberWithToken] = await Promise.all([
      userFactory(prisma, betterAuth),
      userFactory(prisma, betterAuth),
    ]);
    const admin = adminWithToken.user;
    const member = memberWithToken.user;

    const caller = useProtectedCaller(adminWithToken);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: admin.id,
      withParticipantIds: [member.id],
    });

    await caller.transaction.createGroupSheetTransaction(
      createGroupSheetTransactionInput(
        "EXPENSE",
        groupSheet.id,
        groupSheet.currencyCode,
        admin.id,
        member.id,
      ),
    );

    await expect(
      caller.sheet.deleteGroupSheetMember({
        groupSheetId: groupSheet.id,
        participantId: member.id,
      }),
    ).rejects.toThrow("Cannot delete a member with a non-zero balance");
  });

  it("returns a 404 if the participant has no access", async () => {
    const userAndCookie = await userFactory(prisma, betterAuth);
    const { user: member } = await userFactory(prisma, betterAuth);

    const caller = useProtectedCaller(userAndCookie);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.sheet.deleteGroupSheetMember({
        groupSheetId: groupSheet.id,
        participantId: member.id,
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns a 403 if the participant is not an admin", async () => {
    const [memberWithToken, otherMemberWithToken] = await Promise.all([
      userFactory(prisma, betterAuth),
      userFactory(prisma, betterAuth),
    ]);
    const member = memberWithToken.user;
    const otherMember = otherMemberWithToken.user;

    const caller = useProtectedCaller(memberWithToken);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.sheet.deleteGroupSheetMember({
        groupSheetId: groupSheet.id,
        participantId: otherMember.id,
      }),
    ).rejects.toThrow("Only admins can remove other participants");
  });
});
