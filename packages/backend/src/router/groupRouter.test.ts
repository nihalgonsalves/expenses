import { faker } from '@faker-js/faker';
import { GroupParticipantRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { groupFactory, userFactory } from '../../test/factories';
import { getTRPCCaller } from '../../test/getTRPCCaller';
import { generateId } from '../nanoid';

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe('createGroup', () => {
  it('creates a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherMember = await userFactory(prisma);

    const group = await caller.group.createGroup({
      name: 'WG Expenses',
      currencyCode: 'EUR',
      additionalParticipantEmailAddresses: [otherMember.email],
    });

    expect(group).toEqual({
      id: expect.any(String),
      name: 'WG Expenses',
      currencyCode: 'EUR',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      participants: expect.arrayContaining([
        {
          role: GroupParticipantRole.ADMIN,
          participantId: user.id,
          groupId: group.id,
          joinedAt: expect.any(Date),
        },
        {
          role: GroupParticipantRole.MEMBER,
          participantId: otherMember.id,
          groupId: group.id,
          joinedAt: expect.any(Date),
        },
      ]),
    });
  });

  it("creates participants that don't exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherEmail = 'hello@example.com';

    const { participants } = await caller.group.createGroup({
      name: 'WG Expenses',
      currencyCode: 'EUR',
      additionalParticipantEmailAddresses: [otherEmail],
    });

    const { participantId } = participants.find(
      ({ role }) => role === GroupParticipantRole.MEMBER,
    )!;

    expect(
      await prisma.user.findUnique({ where: { id: participantId } }),
    ).toMatchObject({
      name: 'hello',
      email: 'hello@example.com',
    });
  });
});

describe('groupById', () => {
  it('returns a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, { withOwnerId: user.id });

    const groupById = await caller.group.groupById(group.id);

    expect(groupById).toEqual({
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

    await expect(caller.group.groupById(generateId())).rejects.toThrow(
      'Group not found',
    );
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma);

    await expect(caller.group.groupById(group.id)).rejects.toThrow(
      'Group not found',
    );
  });
});

describe('myGroups', () => {
  it('returns all groups where the user is a participant', async () => {
    const user = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const groupWithOwner = await groupFactory(prisma, { withOwnerId: user.id });
    const groupWithMember = await groupFactory(prisma, {
      withParticipantIds: [user.id],
    });
    const otherGroup = await groupFactory(prisma);

    const myGroups = await caller.group.myGroups();

    expect(myGroups.length).toBe(2);

    expect(myGroups.find(({ id }) => id === groupWithOwner.id)).toBeDefined();
    expect(myGroups.find(({ id }) => id === groupWithMember.id)).toBeDefined();
    expect(myGroups.find(({ id }) => id === otherGroup.id)).toBeUndefined();
  });
});

describe('deleteGroup', () => {
  it('deletes a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma, { withOwnerId: user.id });

    await caller.group.deleteGroup(group.id);

    expect(await prisma.group.findUnique({ where: { id: group.id } })).toBe(
      null,
    );
  });

  it.todo('deletes a group with expenses');

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma);

    await expect(caller.group.deleteGroup(group.id)).rejects.toThrow(
      'Group not found',
    );
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma, { withParticipantIds: [user.id] });

    await expect(caller.group.deleteGroup(group.id)).rejects.toThrow(
      'Only admins can delete groups',
    );
  });
});

describe('addParticipant', () => {
  it('adds a participant', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, { withOwnerId: user.id });
    const otherUser = await userFactory(prisma);

    expect(
      await caller.group.addParticipant({
        groupId: group.id,
        participantEmail: otherUser.email,
      }),
    ).toMatchObject({
      id: otherUser.id,
      name: otherUser.name,
      email: otherUser.email,
      role: GroupParticipantRole.MEMBER,
    });
  });

  it('creates a new user if the participant is not signed up', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const group = await groupFactory(prisma, { withOwnerId: user.id });

    const participantEmail = 'jessica@example.com';

    expect(
      await caller.group.addParticipant({
        groupId: group.id,
        participantEmail,
      }),
    ).toMatchObject({
      id: expect.any(String),
      name: 'jessica',
      email: participantEmail,
      role: GroupParticipantRole.MEMBER,
    });
  });

  it('returns a 409 for an existing participant', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherUser = await userFactory(prisma);
    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [otherUser.id],
    });

    await expect(
      caller.group.addParticipant({
        groupId: group.id,
        participantEmail: otherUser.email,
      }),
    ).rejects.toThrow('Participant already exists');
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma);

    await expect(
      caller.group.addParticipant({
        groupId: group.id,
        participantEmail: faker.internet.email(),
      }),
    ).rejects.toThrow('Group not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma, { withParticipantIds: [user.id] });

    await expect(
      caller.group.addParticipant({
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
    const group = await groupFactory(prisma, {
      withOwnerId: user.id,
      withParticipantIds: [member.id],
    });

    await caller.group.deleteParticipant({
      groupId: group.id,
      participantId: member.id,
    });

    expect(
      await prisma.groupParticipants.findUnique({
        where: {
          participantId_groupId: {
            participantId: member.id,
            groupId: group.id,
          },
        },
      }),
    ).toBe(null);
  });

  it('returns a 400 if the admin tries to remove themselves', async () => {
    const admin = await userFactory(prisma);

    const caller = useProtectedCaller(admin);
    const group = await groupFactory(prisma, {
      withOwnerId: admin.id,
    });

    await expect(
      caller.group.deleteParticipant({
        groupId: group.id,
        participantId: admin.id,
      }),
    ).rejects.toThrow('You cannot delete yourself as the last admin');
  });

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.group.deleteParticipant({
        groupId: group.id,
        participantId: member.id,
      }),
    ).rejects.toThrow('Group not found');
  });

  it('returns a 403 if the participant is not an admin', async () => {
    const member = await userFactory(prisma);

    const caller = useProtectedCaller(member);
    const group = await groupFactory(prisma, {
      withParticipantIds: [member.id],
    });

    await expect(
      caller.group.deleteParticipant({
        groupId: group.id,
        participantId: member.id,
      }),
    ).rejects.toThrow('Only admins can remove participants');
  });
});
