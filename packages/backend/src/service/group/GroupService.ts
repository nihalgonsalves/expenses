import { GroupParticipantRole, type PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import { getErrorMessage } from '../../utils';
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
              ...input.additionalParticipantIds.map((id) => ({
                participant: { connect: { id } },
                role: GroupParticipantRole.MEMBER,
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

      throw new GroupServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: getErrorMessage(error),
        cause: error,
      });
    }
  }
}
