import { SheetParticipantRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../../trpc';

import {
  ZCreateGroupSheetInput,
  ZCreatePersonalSheetInput,
  ZFullParticipant,
  ZGroupSheetByIdResponse,
  ZGroupSheetWithParticipants,
  ZGroupSheetsResponse,
  ZSheet,
} from './types';

export const sheetRouter = router({
  myGroupSheets: protectedProcedure
    .output(ZGroupSheetsResponse)
    .query(async ({ ctx }) => {
      const groups = await ctx.sheetService.getGroupSheets(ctx.user);

      return groups.map((group) => ({
        ...group,
        participants: group.participants.map(({ participant }) => participant),
      }));
    }),

  myPersonalSheets: protectedProcedure
    .output(z.array(ZSheet))
    .query(async ({ ctx }) => {
      return ctx.sheetService.getPersonalSheets(ctx.user);
    }),

  groupSheetById: protectedProcedure
    .input(z.string().nonempty())
    .output(ZGroupSheetByIdResponse)
    .query(async ({ input, ctx }) => {
      const group = await ctx.sheetService.getGroupSheetById(input, ctx.user);

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sheet not found' });
      }

      return {
        ...group,
        participants: group.participants.map(
          ({ participant: { id, name } }) => ({
            id,
            name,
          }),
        ),
      };
    }),

  personalSheetById: protectedProcedure
    .input(z.string().nonempty())
    .output(ZSheet)
    .query(async ({ input, ctx }) => {
      const sheet = await ctx.sheetService.getPersonalSheetById(
        input,
        ctx.user,
      );

      if (!sheet) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sheet not found' });
      }

      return sheet;
    }),

  createPersonalSheet: protectedProcedure
    .input(ZCreatePersonalSheetInput)
    .output(ZSheet)
    .mutation(({ ctx, input }) => {
      return ctx.sheetService.createPersonalSheet(input, ctx.user);
    }),

  createGroup: protectedProcedure
    .input(ZCreateGroupSheetInput)
    .output(ZGroupSheetWithParticipants)
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.sheetService.createGroupSheet(input, ctx.user);

      return {
        ...group,
        participants: group.participants.map(({ participantId }) => ({
          id: participantId,
        })),
      };
    }),

  deleteGroup: protectedProcedure
    .input(z.string().nonempty())
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { role } = await ctx.sheetService.ensureGroupMembership(
        input,
        ctx.user.id,
      );

      if (role !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete groups',
        });
      }

      await ctx.sheetService.deleteGroup(input);
    }),

  addParticipant: protectedProcedure
    .input(
      z.object({
        groupId: z.string().nonempty(),
        participantEmail: z.string(),
      }),
    )
    .output(ZFullParticipant)
    .mutation(async ({ input: { groupId, participantEmail }, ctx }) => {
      const { sheet, role: actorRole } =
        await ctx.sheetService.ensureGroupMembership(groupId, ctx.user.id);

      if (actorRole !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can add participants',
        });
      }

      const { participant, role } = await ctx.sheetService.addParticipant(
        sheet,
        participantEmail,
      );

      return {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role,
      };
    }),

  deleteParticipant: protectedProcedure
    .input(
      z.object({
        groupId: z.string().nonempty(),
        participantId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { groupId, participantId }, ctx }) => {
      const { sheet: group, role: actorRole } =
        await ctx.sheetService.ensureGroupMembership(groupId, ctx.user.id);

      if (actorRole !== SheetParticipantRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can remove participants',
        });
      }

      // TODO: modify when adding more admins is possible
      if (participantId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot delete yourself as the last admin',
        });
      }

      await ctx.sheetService.deleteParticipant(group, participantId);
    }),
});
