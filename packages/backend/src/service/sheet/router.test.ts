import { faker } from '@faker-js/faker';
import { SheetParticipantRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  groupSheetFactory,
  personalSheetFactory,
  userFactory,
} from '../../../test/factories';
import { getTRPCCaller } from '../../../test/getTRPCCaller';
import { generateId } from '../../utils/nanoid';

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe('createPersonalSheet', () => {
  it('creates a sheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await caller.sheet.createPersonalSheet({
      name: 'Personal Expenses',
      currencyCode: 'EUR',
    });

    expect(personalSheet).toEqual({
      id: expect.any(String),
      name: 'Personal Expenses',
      currencyCode: 'EUR',
    });
  });
});

describe('createGroup', () => {
  it('creates a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherMember = await userFactory(prisma);

    const group = await caller.sheet.createGroup({
      name: 'WG Expenses',
      currencyCode: 'EUR',
      additionalParticipantEmailAddresses: [otherMember.email],
    });

    expect(group).toEqual({
      id: expect.any(String),
      name: 'WG Expenses',
      currencyCode: 'EUR',
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

    const otherEmail = 'hello@example.com';

    await caller.sheet.createGroup({
      name: 'WG Expenses',
      currencyCode: 'EUR',
      additionalParticipantEmailAddresses: [otherEmail],
    });

    expect(
      await prisma.user.findUnique({ where: { email: otherEmail } }),
    ).toMatchObject({
      name: 'Hello',
      email: 'hello@example.com',
    });
  });
});

describe('personalSheetById', () => {
  it('returns a sheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await personalSheetFactory(prisma, { withOwnerId: user.id });

    const sheetById = await caller.sheet.personalSheetById(group.id);

    expect(sheetById).toEqual({
      id: group.id,
      name: group.name,
      currencyCode: group.currencyCode,
    });
  });

  it("returns a 404 if it doesn't exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.sheet.personalSheetById(generateId())).rejects.toThrow(
      'Sheet not found',
    );
  });

  it("returns a 404 if it is not the user's sheet", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await personalSheetFactory(prisma);

    await expect(caller.sheet.personalSheetById(group.id)).rejects.toThrow(
      'Sheet not found',
    );
  });

  it('returns a 404 for a group sheet ID', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await groupSheetFactory(prisma);

    await expect(
      caller.sheet.personalSheetById(personalSheet.id),
    ).rejects.toThrow('Sheet not found');
  });
});

describe('groupSheetById', () => {
  it('returns a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, { withOwnerId: user.id });

    const groupSheetById = await caller.sheet.groupSheetById(group.id);

    expect(groupSheetById).toEqual({
      id: group.id,
      name: group.name,
      currencyCode: group.currencyCode,
      participants: [
        {
          id: user.id,
          name: user.name,
        },
      ],
    });
  });

  it("returns a 404 if it doesn't exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.sheet.groupSheetById(generateId())).rejects.toThrow(
      'Sheet not found',
    );
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(group.id)).rejects.toThrow(
      'Sheet not found',
    );
  });

  it('returns a 404 for a personal sheet ID', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const personalSheet = await personalSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(personalSheet.id)).rejects.toThrow(
      'Sheet not found',
    );
  });
});

describe('myPersonalSheets', () => {
  it('returns all personal sheets', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const groupWithOwner = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    // otherPersonalSheet
    await personalSheetFactory(prisma);
    // otherGroupSheet
    await groupSheetFactory(prisma);

    const myGroupSheets = await caller.sheet.myPersonalSheets();
    expect(myGroupSheets).toMatchObject([{ id: groupWithOwner.id }]);
  });
});

describe('myGroupSheets', () => {
  it('returns all groups where the user is a participant', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const groupWithOwner = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const groupWithMember = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });
    const otherGroup = await groupSheetFactory(prisma);

    const myGroupSheets = await caller.sheet.myGroupSheets();

    expect(myGroupSheets.length).toBe(2);

    expect(
      myGroupSheets.find(({ id }) => id === groupWithOwner.id),
    ).toBeDefined();
    expect(
      myGroupSheets.find(({ id }) => id === groupWithMember.id),
    ).toBeDefined();
    expect(
      myGroupSheets.find(({ id }) => id === otherGroup.id),
    ).toBeUndefined();
  });
});

describe('deleteGroup', () => {
  it('deletes a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma, { withOwnerId: user.id });

    await caller.sheet.deleteGroup(group.id);

    expect(await prisma.sheet.findUnique({ where: { id: group.id } })).toBe(
      null,
    );
  });

  it.todo('deletes a group with expenses');

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma);

    await expect(caller.sheet.deleteGroup(group.id)).rejects.toThrow(
      'Sheet not found',
    );
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(caller.sheet.deleteGroup(group.id)).rejects.toThrow(
      'Only admins can delete groups',
    );
  });
});

describe('addParticipant', () => {
  it('adds a participant', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, { withOwnerId: user.id });
    const otherUser = await userFactory(prisma);

    expect(
      await caller.sheet.addParticipant({
        groupId: group.id,
        participantEmail: otherUser.email,
      }),
    ).toMatchObject({
      id: otherUser.id,
      name: otherUser.name,
      email: otherUser.email,
      role: SheetParticipantRole.MEMBER,
    });
  });

  it('creates a new user if the participant is not signed up', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupSheetFactory(prisma, { withOwnerId: user.id });

    const participantEmail = 'jessica@example.com';

    expect(
      await caller.sheet.addParticipant({
        groupId: group.id,
        participantEmail,
      }),
    ).toMatchObject({
      id: expect.any(String),
      name: 'Jessica',
      email: participantEmail,
      role: SheetParticipantRole.MEMBER,
    });
  });

  it('returns a 409 for an existing participant', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherUser = await userFactory(prisma);
    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [otherUser.id],
    });

    await expect(
      caller.sheet.addParticipant({
        groupId: group.id,
        participantEmail: otherUser.email,
      }),
    ).rejects.toThrow('Participant already exists');
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma);

    await expect(
      caller.sheet.addParticipant({
        groupId: group.id,
        participantEmail: faker.internet.email(),
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(
      caller.sheet.addParticipant({
        groupId: group.id,
        participantEmail: faker.internet.email(),
      }),
    ).rejects.toThrow('Only admins can add participants');
  });
});

describe('deleteParticipant', () => {
  it('deletes a participant', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    await caller.sheet.deleteParticipant({
      groupId: group.id,
      participantId: member.id,
    });

    expect(
      await prisma.sheetMemberships.findUnique({
        where: {
          sheetMembership: {
            participantId: member.id,
            sheetId: group.id,
          },
        },
      }),
    ).toBe(null);
  });

  it('returns a 400 if the admin tries to remove themselves', async () => {
    const admin = await userFactory(prisma);

    const caller = useProtectedCaller(admin);
    const group = await groupSheetFactory(prisma, {
      withOwnerId: admin.id,
    });

    await expect(
      caller.sheet.deleteParticipant({
        groupId: group.id,
        participantId: admin.id,
      }),
    ).rejects.toThrow('You cannot delete yourself as the last admin');
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const group = await groupSheetFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.sheet.deleteParticipant({
        groupId: group.id,
        participantId: member.id,
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(member);
    const group = await groupSheetFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.sheet.deleteParticipant({
        groupId: group.id,
        participantId: member.id,
      }),
    ).rejects.toThrow('Only admins can remove participants');
  });
});
