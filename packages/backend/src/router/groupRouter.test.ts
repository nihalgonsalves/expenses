import { faker } from '@faker-js/faker';
import { GroupParticipantRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { groupFactory, userFactory } from '../../test/factories';
import { getTRPCCaller } from '../../test/getTRPCCaller';

const { prisma, useProtectedCaller } = await getTRPCCaller();

describe('createGroup', () => {
  it('creates a group', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const otherMember = await userFactory(prisma);

    const group = await caller.group.createGroup({
      name: 'WG Expenses',
      defaultCurrency: 'EUR',
      additionalParticipantEmailAddresses: [otherMember.email],
    });

    expect(group).toEqual({
      id: expect.any(String),
      name: 'WG Expenses',
      defaultCurrency: 'EUR',
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
      defaultCurrency: 'EUR',
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
      defaultCurrency: group.defaultCurrency,
      participants: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: GroupParticipantRole.ADMIN,
        },
      ],
    });
  });

  it("returns a 404 if it doesn't exist", async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(caller.group.groupById(faker.string.uuid())).rejects.toThrow(
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

  it('returns a 404 if the participant has no access', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma);

    await expect(caller.group.deleteGroup(group.id)).rejects.toThrow(
      'Group not found',
    );
  });

  // TODO: This should be a 403, but would require another DB query
  it('returns a 404 if the participant is not an admin', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);
    const group = await groupFactory(prisma, { withParticipantIds: [user.id] });

    await expect(caller.group.deleteGroup(group.id)).rejects.toThrow(
      'Group not found',
    );
  });
});
