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

describe('createGroupSheet', () => {
  it('creates a groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherMember = await userFactory(prisma);

    const groupSheet = await caller.sheet.createGroupSheet({
      name: 'WG Expenses',
      currencyCode: 'EUR',
      additionalParticipantEmailAddresses: [otherMember.email],
    });

    expect(groupSheet).toEqual({
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

    await caller.sheet.createGroupSheet({
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

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const sheetById = await caller.sheet.personalSheetById(personalSheet.id);

    expect(sheetById).toEqual({
      id: personalSheet.id,
      name: personalSheet.name,
      currencyCode: personalSheet.currencyCode,
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

    const personalSheet = await personalSheetFactory(prisma);

    await expect(
      caller.sheet.personalSheetById(personalSheet.id),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns a 404 for a groupSheet ID', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.personalSheetById(groupSheet.id)).rejects.toThrow(
      'Sheet not found',
    );
  });
});

describe('groupSheetById', () => {
  it('returns a groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const groupSheetById = await caller.sheet.groupSheetById(groupSheet.id);

    expect(groupSheetById).toEqual({
      id: groupSheet.id,
      name: groupSheet.name,
      currencyCode: groupSheet.currencyCode,
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

    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.groupSheetById(groupSheet.id)).rejects.toThrow(
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
    const ownedGroupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const participatingGroupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });
    const otherGroupSheet = await groupSheetFactory(prisma);

    const myGroupSheets = await caller.sheet.myGroupSheets();

    expect(myGroupSheets.length).toBe(2);

    expect(
      myGroupSheets.find(({ id }) => id === ownedGroupSheet.id),
    ).toBeDefined();
    expect(
      myGroupSheets.find(({ id }) => id === participatingGroupSheet.id),
    ).toBeDefined();
    expect(
      myGroupSheets.find(({ id }) => id === otherGroupSheet.id),
    ).toBeUndefined();
  });
});

describe('deleteGroupSheet', () => {
  it('deletes a groupSheet', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    await caller.sheet.deleteGroupSheet(groupSheet.id);

    expect(
      await prisma.sheet.findUnique({ where: { id: groupSheet.id } }),
    ).toBe(null);
  });

  it.todo('deletes a deleteGroupSheet with expenses');

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(caller.sheet.deleteGroupSheet(groupSheet.id)).rejects.toThrow(
      'Sheet not found',
    );
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(caller.sheet.deleteGroupSheet(groupSheet.id)).rejects.toThrow(
      'Only admins can delete groups',
    );
  });
});

describe('addParticipant', () => {
  it('adds a participant', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });
    const otherUser = await userFactory(prisma);

    expect(
      await caller.sheet.addParticipant({
        groupSheetId: groupSheet.id,
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

    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const participantEmail = 'jessica@example.com';

    expect(
      await caller.sheet.addParticipant({
        groupSheetId: groupSheet.id,
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
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [otherUser.id],
    });

    await expect(
      caller.sheet.addParticipant({
        groupSheetId: groupSheet.id,
        participantEmail: otherUser.email,
      }),
    ).rejects.toThrow('Participant already exists');
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma);

    await expect(
      caller.sheet.addParticipant({
        groupSheetId: groupSheet.id,
        participantEmail: faker.internet.email(),
      }),
    ).rejects.toThrow('Sheet not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [user.id],
    });

    await expect(
      caller.sheet.addParticipant({
        groupSheetId: groupSheet.id,
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
    const groupSheet = await groupSheetFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    await caller.sheet.deleteGroupSheetMember({
      groupSheetId: groupSheet.id,
      participantId: member.id,
    });

    expect(
      await prisma.sheetMemberships.findUnique({
        where: {
          sheetMembership: {
            participantId: member.id,
            sheetId: groupSheet.id,
          },
        },
      }),
    ).toBe(null);
  });

  it('returns a 400 if the admin tries to remove themselves', async () => {
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
    ).rejects.toThrow('You cannot delete yourself as the last admin');
  });

  it('returns a 404 if the participant has no access', async () => {
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
    ).rejects.toThrow('Sheet not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(member);
    const groupSheet = await groupSheetFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.sheet.deleteGroupSheetMember({
        groupSheetId: groupSheet.id,
        participantId: member.id,
      }),
    ).rejects.toThrow('Only admins can remove participants');
  });
});
