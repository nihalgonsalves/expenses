import type {
  Sheet,
  CreateGroupSheetInput,
  CreatePersonalSheetInput,
  GroupSheetWithParticipants,
  UpdateSheetInput,
} from "@nihalgonsalves/expenses-shared/types/sheet";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../../create-prisma.ts";
import {
  SheetType,
  SheetParticipantRole,
  Prisma,
} from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";
import { AppError, getInternalError } from "../../utils/errors.ts";
import type { TransactionService } from "../transaction/transaction-service.ts";
import type { UserService } from "../user/user-service.ts";

class SheetServiceError extends AppError {}

export class SheetService {
  private prismaClient: Pick<
    PrismaClientType,
    "$queryRaw" | "sheet" | "sheetMemberships"
  >;
  private transactionService: TransactionService;
  private userService: Pick<UserService, "findByEmail" | "inviteUser">;

  constructor(
    prismaClient: SheetService["prismaClient"],
    transactionService: SheetService["transactionService"],
    userService: SheetService["userService"],
  ) {
    this.prismaClient = prismaClient;
    this.transactionService = transactionService;
    this.userService = userService;
  }

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
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        throw new SheetServiceError({
          code: "BAD_REQUEST",
          message: "Invalid input",
          cause: error,
        });
      }

      throw new SheetServiceError(getInternalError(error));
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
            ],
          },
        },
        include: { participants: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        throw new SheetServiceError({
          code: "BAD_REQUEST",
          message: "Invalid input",
          cause: error,
        });
      }

      throw new SheetServiceError(getInternalError(error));
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

  async getSheets(user: User, includeArchived: boolean) {
    return this.prismaClient.sheet.findMany({
      where: {
        participants: { some: { participantId: user.id } },
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: { participants: { include: { participant: true } } },
    });
  }

  async getFrequentlyUsedCurrencyCodes(
    user: User,
    supportedCurrencyCodes: string[],
  ) {
    if (supportedCurrencyCodes.length === 0) return [];

    const currencies = await this.prismaClient.$queryRaw<
      { currencyCode: string }[]
    >`
      WITH accessible_sheets AS (
        SELECT sheets.id, sheets.currency_code, sheets.updated_at
        FROM sheets
        INNER JOIN sheet_memberships
          ON sheet_memberships.sheet_id = sheets.id
        WHERE sheet_memberships.participant_id = ${user.id}
      ),
      currency_usage AS (
        SELECT
          accessible_sheets.currency_code,
          0::bigint AS transaction_count,
          1::bigint AS sheet_count,
          accessible_sheets.updated_at AS last_used_at
        FROM accessible_sheets

        UNION ALL

        SELECT
          COALESCE(
            transactions.original_currency_code,
            accessible_sheets.currency_code
          ) AS currency_code,
          1::bigint AS transaction_count,
          0::bigint AS sheet_count,
          transactions.spent_at AS last_used_at
        FROM accessible_sheets
        INNER JOIN transactions
          ON transactions.sheet_id = accessible_sheets.id
      )
      SELECT currency_code AS "currencyCode"
      FROM currency_usage
      WHERE currency_code IN (${Prisma.join(supportedCurrencyCodes)})
      GROUP BY currency_code
      ORDER BY
        SUM(transaction_count) DESC,
        MAX(last_used_at) DESC,
        SUM(sheet_count) DESC,
        currency_code ASC
      LIMIT 5
    `;

    return currencies.map(({ currencyCode }) => currencyCode);
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

  async deleteSheet(id: string) {
    return this.prismaClient.sheet.delete({
      where: {
        id,
      },
    });
  }

  async updateSheet(input: UpdateSheetInput) {
    return this.prismaClient.sheet.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
      },
    });
  }

  async setSheetArchived(id: string, isArchived: boolean) {
    return this.prismaClient.sheet.update({
      where: {
        id,
      },
      data: {
        isArchived,
      },
    });
  }

  async addGroupSheetMember(input: {
    participantName: string;
    participantEmail: string;
    groupSheet: Sheet;
    invitedBy: User;
  }) {
    const user =
      (await this.userService.findByEmail(input.participantEmail)) ??
      (await this.userService.inviteUser({
        invitedUserName: input.participantName,
        invitedUserEmail: input.participantEmail,
        invitedBy: input.invitedBy,
        groupSheet: input.groupSheet,
      }));

    try {
      const member = await this.prismaClient.sheetMemberships.create({
        data: {
          sheet: { connect: { id: input.groupSheet.id } },
          participant: {
            connect: { id: user.id },
          },
        },
        include: { participant: true },
      });

      return member;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new SheetServiceError({
          code: "CONFLICT",
          message: "Participant already exists",
          cause: error,
        });
      }

      throw error;
    }
  }

  async deleteGroupSheetMember(groupSheet: Sheet, participantId: string) {
    const balance = await this.transactionService.getParticipantBalance(
      groupSheet,
      participantId,
    );

    if (balance.amount !== 0) {
      throw new SheetServiceError({
        code: "BAD_REQUEST",
        message: "Cannot delete a member with a non-zero balance",
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
        code: "NOT_FOUND",
        message: "Sheet not found",
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
      throw new SheetServiceError({
        code: "NOT_FOUND",
        message: "Sheet not found",
      });
    }

    return { sheet: sheetWithParticipants, role };
  }
}
