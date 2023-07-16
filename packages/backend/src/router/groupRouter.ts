import { GroupParticipantRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateGroupInput,
  ZFullParticipant,
  ZGroupByIdResponse,
  ZGroupsResponse,
} from '../service/group/types';
import { protectedProcedure, router } from '../trpc';

export const groupRouter = router({
  myGroups: protectedProcedure
    .output(ZGroupsResponse)
    .query(async ({ ctx }) => {
      const groups = await ctx.groupService.getGroups(ctx.user);

      return groups.map((group) => ({
        ...group,
        participants: group.participants.map(({ participant }) => participant),
      }));
    }),

  groupById: protectedProcedure
    .input(z.string().uuid())
    .output(ZGroupByIdResponse)
    .query(async ({ input, ctx }) => {
      const group = await ctx.groupService.getGroupById(input, ctx.user);

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
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

  createGroup: protectedProcedure
    .input(ZCreateGroupInput)
    .mutation(async ({ input, ctx }) =>
      ctx.groupService.createGroup(input, ctx.user),
    ),

  deleteGroup: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      const { role } = await ctx.groupService.ensureGroupMembership(
        input,
        ctx.user.id,
      );

      if (role !== GroupParticipantRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete groups',
        });
      }

      await ctx.groupService.deleteGroup(input);
    }),

  addParticipant: protectedProcedure
    .input(
      z.object({ groupId: z.string().uuid(), participantEmail: z.string() }),
    )
    .output(ZFullParticipant)
    .mutation(async ({ input: { groupId, participantEmail }, ctx }) => {
      const { group, role: actorRole } =
        await ctx.groupService.ensureGroupMembership(groupId, ctx.user.id);

      if (actorRole !== GroupParticipantRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can add participants',
        });
      }

      const { participant, role } = await ctx.groupService.addParticipant(
        group,
        participantEmail,
      );

      return {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role,
      };
    }),
});
