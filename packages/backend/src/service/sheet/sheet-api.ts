import { z } from "zod";

import {
  type ZAddGroupSheetMemberInput,
  type ZCreateGroupSheetInput,
  type ZCreatePersonalSheetInput,
  ZFullParticipant,
  ZGroupSheetByIdResponse,
  ZGroupSheetWithParticipants,
  ZSheet,
  type ZSheetsQuery,
  ZSheetsResponse,
  type ZUpdateSheetInput,
} from "@nihalgonsalves/expenses-shared/types/sheet";

import type { ContextObj } from "../../context.ts";
import { SheetParticipantRole } from "../../prisma/client.ts";
import { AppError } from "../../utils/errors.ts";

type AuthenticatedContext = Pick<ContextObj, "sheetService"> & {
  user: NonNullable<ContextObj["user"]>;
};

export const getMySheets = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZSheetsQuery>,
) => {
  const sheets = await ctx.sheetService.getSheets(
    ctx.user,
    input.includeArchived,
  );
  return ZSheetsResponse.parse(
    sheets.map((sheet) => ({
      ...sheet,
      participants: sheet.participants.map(({ participant }) => participant),
    })),
  );
};

export const getGroupSheetById = async (
  ctx: AuthenticatedContext,
  id: string,
) => {
  const sheet = await ctx.sheetService.getGroupSheetById(id, ctx.user);
  if (!sheet)
    throw new AppError({ code: "NOT_FOUND", message: "Sheet not found" });
  return ZGroupSheetByIdResponse.parse({
    ...sheet,
    participants: sheet.participants.map(
      ({ participant: { id: participantId, name, email }, role }) => ({
        id: participantId,
        name,
        email,
        role,
      }),
    ),
  });
};

export const getPersonalSheetById = async (
  ctx: AuthenticatedContext,
  id: string,
) => {
  const sheet = await ctx.sheetService.getPersonalSheetById(id, ctx.user);
  if (!sheet)
    throw new AppError({ code: "NOT_FOUND", message: "Sheet not found" });
  return ZSheet.parse(sheet);
};

export const createPersonalSheet = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZCreatePersonalSheetInput>,
) => ZSheet.parse(await ctx.sheetService.createPersonalSheet(input, ctx.user));

export const createGroupSheet = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZCreateGroupSheetInput>,
) => {
  const sheet = await ctx.sheetService.createGroupSheet(input, ctx.user);
  return ZGroupSheetWithParticipants.parse({
    ...sheet,
    participants: sheet.participants.map(({ participantId }) => ({
      id: participantId,
    })),
  });
};

export const updateSheet = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZUpdateSheetInput>,
) => {
  const { role } = await ctx.sheetService.ensureSheetMembership(
    input.id,
    ctx.user.id,
  );
  if (role !== SheetParticipantRole.ADMIN) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only admins can update sheets",
    });
  }
  await ctx.sheetService.updateSheet(input);
};

export const ZArchiveSheetInput = z.object({
  sheetId: z.string().min(1),
  isArchived: z.boolean(),
});

export const archiveSheet = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZArchiveSheetInput>,
) => {
  const { role } = await ctx.sheetService.ensureSheetMembership(
    input.sheetId,
    ctx.user.id,
  );
  if (role !== SheetParticipantRole.ADMIN) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only admins can archive sheets",
    });
  }
  await ctx.sheetService.setSheetArchived(input.sheetId, input.isArchived);
};

export const deleteSheet = async (ctx: AuthenticatedContext, id: string) => {
  const { role } = await ctx.sheetService.ensureSheetMembership(
    id,
    ctx.user.id,
  );
  if (role !== SheetParticipantRole.ADMIN) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only admins can delete sheets",
    });
  }
  await ctx.sheetService.deleteSheet(id);
};

export const addGroupSheetMember = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZAddGroupSheetMemberInput>,
) => {
  const { sheet, role } = await ctx.sheetService.ensureGroupSheetMembership(
    input.groupSheetId,
    ctx.user.id,
  );
  if (role !== SheetParticipantRole.ADMIN) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only admins can add participants",
    });
  }
  const result = await ctx.sheetService.addGroupSheetMember({
    groupSheet: sheet,
    participantName: input.name,
    participantEmail: input.email,
    invitedBy: ctx.user,
  });
  return ZFullParticipant.parse({
    id: result.participant.id,
    name: result.participant.name,
    email: result.participant.email,
    role: result.role,
  });
};

export const ZDeleteGroupSheetMemberInput = z.object({
  groupSheetId: z.string().min(1),
  participantId: z.string().min(1),
});

export const deleteGroupSheetMember = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZDeleteGroupSheetMemberInput>,
) => {
  const { sheet, role } = await ctx.sheetService.ensureGroupSheetMembership(
    input.groupSheetId,
    ctx.user.id,
  );
  if (
    role !== SheetParticipantRole.ADMIN &&
    input.participantId !== ctx.user.id
  ) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only admins can remove other participants",
    });
  }
  if (
    role === SheetParticipantRole.ADMIN &&
    input.participantId === ctx.user.id
  ) {
    throw new AppError({
      code: "BAD_REQUEST",
      message: "You cannot delete yourself as the last admin",
    });
  }
  await ctx.sheetService.deleteGroupSheetMember(sheet, input.participantId);
};
