import { GroupParticipantRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { userFactory } from '../../test/factories';
import { getTRPCCaller } from '../../test/getTRPCCaller';

const { prisma, useProtectedCaller, getDefaultUser } = await getTRPCCaller();

describe('createGroup', () => {
  it('creates a group ', async () => {
    const caller = useProtectedCaller();

    const otherMember = await userFactory(prisma);

    const group = await caller.group.createGroup({
      name: 'WG Expenses',
      defaultCurrency: 'EUR',
      additionalParticipantIds: [otherMember.id],
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
          participantId: getDefaultUser()?.id,
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

  it('returns an error for invalid participants ', async () => {
    const caller = useProtectedCaller();

    await expect(
      caller.group.createGroup({
        name: 'WG Expenses',
        defaultCurrency: 'EUR',
        additionalParticipantIds: ['invalid-id'],
      }),
    ).rejects.toThrow('Invalid input');
  });
});
