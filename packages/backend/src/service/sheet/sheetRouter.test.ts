import { faker } from "@faker-js/faker";
import { SheetParticipantRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/getTRPCCaller.ts";
import { createGroupSheetTransactionInput } from "../../../test/input.ts";
import { generateId } from "../../utils/nanoid.ts";

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe("createPersonalSheet", () => {
  it("creates a sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherMember = await userFactory(prisma);

    const groupSheet = await caller.sheet.createGroupSheet({
      name: "WG Expenses",
      currencyCode: "EUR",
      additionalParticipantEmailAddresses: [{ email: otherMember.email }],
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
        {
          id: otherMember.id,
        },
      ]),
    });
  });

  it("creates participants that don't exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherEmail = "hello@example.com";

    await caller.sheet.createGroupSheet({
      name: "WG Expenses",
      currencyCode: "EUR",
      additionalParticipantEmailAddresses: [{ email: otherEmail }],
    });

    await expect(
      prisma.user.findUnique({ where: { email: otherEmail } }),
    ).resolves.toMatchObject({
      name: "Hello",
      email: "hello@example.com",
    });
  });
});

describe("personalSheetById", () => {
  it("returns a sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.sheet.personalSheetById(generateId())).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 if it is not the user's sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.sheet.personalSheetById(personalSheet.id),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns a 404 for a groupSheet ID", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.personalSheetById(groupSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });
});

describe("groupSheetById", () => {
  it("returns a groupSheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.sheet.groupSheetById(generateId())).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 if the participant has no access", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(groupSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });

  it("returns a 404 for a personal sheet ID", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(personalSheet.id)).rejects.toThrow(
      "Sheet not found",
    );
  });
});

describe("mySheets", () => {
  it("returns all personal sheets", async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
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
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);

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
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
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
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
      const sheet = await factory(prisma, {
        withOwnerId: user.id,
      });

      await caller.sheet.updateSheet({ id: sheet.id, name: "Updated sheet" });

      await expect(
        prisma.sheet.findUnique({ where: { id: sheet.id } }),
      ).resolves.toMatchObject({ name: "Updated sheet" });
    });

    it("returns a 404 if the participant has no access", async () => {
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
      const sheet = await factory(prisma);

      await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
        "Sheet not found",
      );
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const user = await userFactory(prisma);
        const caller = useProtectedCaller(user);
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
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
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
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
      const sheet = await factory(prisma);

      await expect(caller.sheet.deleteSheet(sheet.id)).rejects.toThrow(
        "Sheet not found",
      );
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const user = await userFactory(prisma);
        const caller = useProtectedCaller(user);
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
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
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
      const user = await userFactory(prisma);
      const caller = useProtectedCaller(user);
      const sheet = await factory(prisma);

      await expect(
        caller.sheet.archiveSheet({ sheetId: sheet.id, isArchived: true }),
      ).rejects.toThrow("Sheet not found");
    });

    if (sheetType === "groupSheet") {
      it("returns a 403 if the participant is not an admin", async () => {
        const user = await userFactory(prisma);
        const caller = useProtectedCaller(user);
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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const otherUser = await userFactory(prisma);

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const participantEmail = "jessica@example.com";

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
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
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherUser = await userFactory(prisma);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [otherUser.id],
    });

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        email: otherUser.email,
      }),
    ).rejects.toThrow("Participant already exists");
  });

  it("returns a 404 if the participant has no access", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        email: faker.internet.email(),
      }),
    ).rejects.toThrow("Sheet not found");
  });

  it("returns a 403 if the participant is not an admin", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(
      caller.sheet.addGroupSheetMember({
        groupSheetId: groupSheet.id,
        email: faker.internet.email(),
      }),
    ).rejects.toThrow("Only admins can add participants");
  });
});

describe("deleteParticipant", () => {
  it("deletes a participant as admin", async () => {
    const [user, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(user);
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
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
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
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
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
    const admin = await userFactory(prisma);

    const caller = useProtectedCaller(admin);
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
    const [admin, member] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(admin);
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
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(user);
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
    const [member, otherMember] = await Promise.all([
      userFactory(prisma),
      userFactory(prisma),
    ]);

    const caller = useProtectedCaller(member);
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
