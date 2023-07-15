import { GroupParticipantRole, type PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import { getTRPCError } from '../../utils';
import { type User } from '../user/types';

import { type CreateGroupInput } from './types';

class GroupServiceError extends TRPCError {}

export class GroupService {
  constructor(private prismaClient: PrismaClient) {}

  async createGroup(input: CreateGroupInput, owner: User) {
    try {
      return await this.prismaClient.group.create({
        data: {
          name: input.name,
          defaultCurrency: input.defaultCurrency,
          participants: {
            create: [
              {
                role: GroupParticipantRole.ADMIN,
                participant: { connect: { id: owner.id } },
              },
              ...input.additionalParticipantEmailAddresses.map((email) => ({
                role: GroupParticipantRole.MEMBER,
                participant: {
                  connectOrCreate: {
                    create: { name: email.split('@')?.[0] ?? email, email },
                    where: { email },
                  },
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

  async deleteGroup(id: string, deletedBy: User) {
    try {
      return await this.prismaClient.group.delete({
        where: {
          id,
          participants: {
            some: {
              participantId: deletedBy.id,
              role: GroupParticipantRole.ADMIN,
            },
          },
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
}
