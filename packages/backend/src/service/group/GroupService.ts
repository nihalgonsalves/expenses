import { GroupParticipantRole, type PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import { generateId } from '../../nanoid';
import { getTRPCError } from '../../trpcUtils';
import { type User } from '../user/types';

import {
  type Group,
  type CreateGroupInput,
  type GroupWithParticipants,
} from './types';

class GroupServiceError extends TRPCError {}

export const nameFromEmail = (email: string) => {
  const firstPart = email.split('@')[0];

  if (!firstPart) {
    return 'No Name';
  }

  return firstPart
    .replace(/[^A-Za-z]/gu, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => {
      const lowerCase = part.toLowerCase();
      return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
    })
    .join(' ');
};

const participantConnectOrCreate = (email: string) => ({
  create: { id: generateId(), name: nameFromEmail(email), email },
  where: { email },
});

export class GroupService {
  constructor(private prismaClient: PrismaClient) {}

  async createGroup(input: CreateGroupInput, owner: User) {
    try {
      return await this.prismaClient.group.create({
        data: {
          id: generateId(),
          name: input.name,
          currencyCode: input.currencyCode,
          participants: {
            create: [
              {
                role: GroupParticipantRole.ADMIN,
                participant: { connect: { id: owner.id } },
              },
              ...input.additionalParticipantEmailAddresses.map((email) => ({
                role: GroupParticipantRole.MEMBER,
                participant: {
                  connectOrCreate: participantConnectOrCreate(email),
                },
              })),
            ],
          },
        },
        include: { participants: true },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error instanceof PrismaClientValidationError
      ) {
        throw new GroupServiceError({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          cause: error,
        });
      }

      throw new GroupServiceError(getTRPCError(error));
    }
  }

  async getGroupById(id: string, viewer: User) {
    return this.prismaClient.group.findUnique({
      where: { id, participants: { some: { participantId: viewer.id } } },
      include: { participants: { include: { participant: true } } },
    });
  }

  async getGroups(viewer: User) {
    return this.prismaClient.group.findMany({
      where: { participants: { some: { participantId: viewer.id } } },
      include: { participants: { include: { participant: true } } },
    });
  }

  async deleteGroup(id: string) {
    try {
      return await this.prismaClient.group.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GroupServiceError({
          code: 'NOT_FOUND',
          message: 'Group not found',
          cause: error,
        });
      }

      throw new GroupServiceError(getTRPCError(error));
    }
  }

  async addParticipant(group: Group, participantEmail: string) {
    try {
      const participant = await this.prismaClient.groupParticipants.create({
        data: {
          group: { connect: { id: group.id } },
          participant: {
            connectOrCreate: participantConnectOrCreate(participantEmail),
          },
        },
        include: { participant: true },
      });

      return participant;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new GroupServiceError({
          code: 'CONFLICT',
          message: 'Participant already exists',
          cause: error,
        });
      }

      throw error;
    }
  }

  async deleteParticipant(group: Group, participantId: string) {
    const expenseTransactionCount =
      await this.prismaClient.expenseTransactions.count({
        where: {
          expense: { groupId: group.id },
          userId: participantId,
        },
      });

    if (expenseTransactionCount > 0) {
      throw new GroupServiceError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete participant with existing expenses',
      });
    }

    await this.prismaClient.groupParticipants.delete({
      where: {
        participantId_groupId: {
          participantId,
          groupId: group.id,
        },
      },
    });
  }

  async ensureGroupMembership(groupId: string, userId: string) {
    const { group, role } = await this.groupMembership(groupId, userId);

    if (!role) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    return { group, role };
  }

  async groupMembership(
    groupId: string,
    participantId: string,
  ): Promise<{
    group: GroupWithParticipants;
    role: GroupParticipantRole | undefined;
  }> {
    const group = await this.prismaClient.group.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });

    if (!group) {
      throw new GroupServiceError({
        code: 'NOT_FOUND',
        message: 'Group not found',
      });
    }

    const participant = group.participants.find(
      ({ participantId: id }) => id === participantId,
    );

    return {
      group: {
        ...group,
        participants: group.participants.map(({ participantId: id }) => ({
          id,
        })),
      },
      role: participant?.role,
    };
  }
}
