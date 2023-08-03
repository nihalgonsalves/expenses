import {
  SheetType,
  type PrismaClient,
  SheetParticipantRole,
} from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import { generateId } from '../../utils/nanoid';
import { getTRPCError } from '../../utils/trpcUtils';
import type { User } from '../user/types';

import type {
  Sheet,
  CreateGroupSheetInput,
  CreatePersonalSheetInput,
  GroupSheetWithParticipants,
} from './types';

class SheetServiceError extends TRPCError {}

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

export class SheetService {
  constructor(private prismaClient: PrismaClient) {}

  async createPersonalSheet(input: CreatePersonalSheetInput, owner: User) {
    try {
      return await this.prismaClient.sheet.create({
        data: {
          id: generateId(),
          type: SheetType.PERSONAL,
          name: input.name,
          currencyCode: input.currencyCode,
          participants: {
            create: [
              {
                role: SheetParticipantRole.ADMIN,
                participant: { connect: { id: owner.id } },
              },
            ],
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error instanceof PrismaClientValidationError
      ) {
        throw new SheetServiceError({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          cause: error,
        });
      }

      throw new SheetServiceError(getTRPCError(error));
    }
  }

  async createGroupSheet(input: CreateGroupSheetInput, owner: User) {
    try {
      return await this.prismaClient.sheet.create({
        data: {
          id: generateId(),
          type: SheetType.GROUP,
          name: input.name,
          currencyCode: input.currencyCode,
          participants: {
            create: [
              {
                role: SheetParticipantRole.ADMIN,
                participant: { connect: { id: owner.id } },
              },
              ...input.additionalParticipantEmailAddresses.map((email) => ({
                role: SheetParticipantRole.MEMBER,
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
        throw new SheetServiceError({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          cause: error,
        });
      }

      throw new SheetServiceError(getTRPCError(error));
    }
  }

  async getPersonalSheetById(id: string, viewer: User) {
    return this.prismaClient.sheet.findUnique({
      where: {
        id,
        type: SheetType.PERSONAL,
        participants: { some: { participantId: viewer.id } },
      },
    });
  }

  async getPersonalSheets(user: User) {
    return this.prismaClient.sheet.findMany({
      where: {
        type: SheetType.PERSONAL,
        participants: { some: { participantId: user.id } },
      },
    });
  }

  async getGroupSheetById(id: string, viewer: User) {
    return this.prismaClient.sheet.findUnique({
      where: {
        id,
        type: SheetType.GROUP,
        participants: { some: { participantId: viewer.id } },
      },
      include: { participants: { include: { participant: true } } },
    });
  }

  async getGroupSheets(viewer: User) {
    return this.prismaClient.sheet.findMany({
      where: {
        type: SheetType.GROUP,
        participants: { some: { participantId: viewer.id } },
      },
      include: { participants: { include: { participant: true } } },
    });
  }

  async deleteSheet(id: string) {
    return this.prismaClient.sheet.delete({
      where: {
        id,
      },
    });
  }

  async addGroupSheetMember(groupSheet: Sheet, participantEmail: string) {
    try {
      const member = await this.prismaClient.sheetMemberships.create({
        data: {
          sheet: { connect: { id: groupSheet.id } },
          participant: {
            connectOrCreate: participantConnectOrCreate(participantEmail),
          },
        },
        include: { participant: true },
      });

      return member;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new SheetServiceError({
          code: 'CONFLICT',
          message: 'Participant already exists',
          cause: error,
        });
      }

      throw error;
    }
  }

  async deleteGroupSheetMember(groupSheet: Sheet, participantId: string) {
    const expenseTransactionCount =
      await this.prismaClient.expenseTransactions.count({
        where: {
          expense: { sheetId: groupSheet.id },
          userId: participantId,
        },
      });

    if (expenseTransactionCount > 0) {
      throw new SheetServiceError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete participant with existing expenses',
      });
    }

    await this.prismaClient.sheetMemberships.delete({
      where: {
        sheetMembership: {
          participantId,
          sheetId: groupSheet.id,
        },
      },
    });
  }

  async ensurePersonalSheetMembership(personalSheetId: string, userId: string) {
    return this.ensureSheetMembership(
      personalSheetId,
      userId,
      SheetType.PERSONAL,
    );
  }

  async ensureGroupSheetMembership(groupSheetId: string, userId: string) {
    return this.ensureSheetMembership(groupSheetId, userId, SheetType.GROUP);
  }

  async ensureSheetMembership(
    groupSheetId: string,
    userId: string,
    type?: SheetType,
  ): Promise<{
    sheet: GroupSheetWithParticipants;
    role: SheetParticipantRole;
  }> {
    const sheet = await this.prismaClient.sheet.findUnique({
      where: { id: groupSheetId },
      include: { participants: true },
    });

    if (!sheet || (type && sheet.type !== type)) {
      throw new SheetServiceError({
        code: 'NOT_FOUND',
        message: 'Sheet not found',
      });
    }

    const participant = sheet.participants.find(
      ({ participantId: id }) => id === userId,
    );

    const sheetWithParticipants = {
      ...sheet,
      participants: sheet.participants.map(({ participantId: id }) => ({
        id,
      })),
    };

    const role = participant?.role;

    if (!role) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Sheet not found',
      });
    }

    return { sheet: sheetWithParticipants, role };
  }
}
