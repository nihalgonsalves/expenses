import { SheetParticipantRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  ZCreateGroupSheetInput,
  ZCreatePersonalSheetInput,
  ZFullParticipant,
  ZGroupSheetByIdResponse,
  ZGroupSheetWithParticipants,
  ZSheetsResponse,
  ZSheet,
  ZSheetsQuery,
  ZAddGroupSheetMemberInput,
  ZUpdateSheetInput,
} from "@nihalgonsalves/expenses-shared/types/sheet";

import { protectedProcedure, router } from "../../trpc.ts";

export const sheetRouter = router({
  mySheets: protectedProcedure
    .input(ZSheetsQuery)
    .output(ZSheetsResponse)
    .query(async ({ ctx, input }) => {
      const groupSheets = await ctx.sheetService.getSheets(
        ctx.user,
        input.includeArchived,
      );

      return groupSheets.map((groupSheet) => ({
        ...groupSheet,
        participants: groupSheet.participants.map(
          ({ participant }) => participant,
        ),
      }));
    }),

  groupSheetById: protectedProcedure
    .input(z.string().min(1))
    .output(ZGroupSheetByIdResponse)
    .query(async ({ input, ctx }) => {
      const groupSheet = await ctx.sheetService.getGroupSheetById(
        input,
        ctx.user,
      );

      if (!groupSheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }

      return {
        ...groupSheet,
        participants: groupSheet.participants.map(
          ({ participant: { id, name, email }, role }) => ({
            id,
            name,
            email,
            role,
          }),
        ),
      };
    }),

  personalSheetById: protectedProcedure
    .input(z.string().min(1))
    .output(ZSheet)
    .query(async ({ input, ctx }) => {
      const sheet = await ctx.sheetService.getPersonalSheetById(
        input,
        ctx.user,
      );

      if (!sheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }

      return sheet;
    }),

  createPersonalSheet: protectedProcedure
    .input(ZCreatePersonalSheetInput)
    .output(ZSheet)
    .mutation(async ({ ctx, input }) =>
      ctx.sheetService.createPersonalSheet(input, ctx.user),
    ),

  createGroupSheet: protectedProcedure
    .input(ZCreateGroupSheetInput)
    .output(ZGroupSheetWithParticipants)
    .mutation(async ({ input, ctx }) => {
      const groupSheet = await ctx.sheetService.createGroupSheet(
        input,
        ctx.user,
      );

      return {
        ...groupSheet,
        participants: groupSheet.participants.map(({ participantId }) => ({
          id: participantId,
        })),
      };
    }),

  updateSheet: protectedProcedure
    .input(ZUpdateSheetInput)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { role } = await ctx.sheetService.ensureSheetMembership(
        input.id,
        ctx.user.id,
      );

      if (role !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update sheets",
        });
      }

      await ctx.sheetService.updateSheet(input);
    }),

  archiveSheet: protectedProcedure
    .input(z.object({ sheetId: z.string().min(1), isArchived: z.boolean() }))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { role } = await ctx.sheetService.ensureSheetMembership(
        input.sheetId,
        ctx.user.id,
      );

      if (role !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can archive sheets",
        });
      }

      await ctx.sheetService.setSheetArchived(input.sheetId, input.isArchived);
    }),

  deleteSheet: protectedProcedure
    .input(z.string().min(1))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { role } = await ctx.sheetService.ensureSheetMembership(
        input,
        ctx.user.id,
      );

      if (role !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete sheets",
        });
      }

      await ctx.sheetService.deleteSheet(input);
    }),

  addGroupSheetMember: protectedProcedure
    .input(ZAddGroupSheetMemberInput)
    .output(ZFullParticipant)
    .mutation(async ({ input: { groupSheetId, email }, ctx }) => {
      const { sheet, role: actorRole } =
        await ctx.sheetService.ensureGroupSheetMembership(
          groupSheetId,
          ctx.user.id,
        );

      if (actorRole !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can add participants",
        });
      }

      const { participant, role } = await ctx.sheetService.addGroupSheetMember(
        sheet,
        email,
      );

      return {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role,
      };
    }),

  deleteGroupSheetMember: protectedProcedure
    .input(
      z.object({
        groupSheetId: z.string().min(1),
        participantId: z.string().min(1),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { groupSheetId, participantId }, ctx }) => {
      const { sheet, role: actorRole } =
        await ctx.sheetService.ensureGroupSheetMembership(
          groupSheetId,
          ctx.user.id,
        );

      if (actorRole === SheetParticipantRole.ADMIN) {
        // TODO: modify when adding more admins is possible
        if (participantId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot delete yourself as the last admin",
          });
        }
      } else if (participantId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can remove other participants",
        });
      }

      await ctx.sheetService.deleteGroupSheetMember(sheet, participantId);
    }),
});
