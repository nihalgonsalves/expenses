import { GroupParticipantRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateGroupInput,
  ZFullParticipant,
  ZGroupByIdResponse,
  ZGroupWithParticipants,
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
    .input(z.string().nonempty())
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
    .output(ZGroupWithParticipants)
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.groupService.createGroup(input, ctx.user);

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
      z.object({
        groupId: z.string().nonempty(),
        participantEmail: z.string(),
      }),
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

  deleteParticipant: protectedProcedure
    .input(
      z.object({
        groupId: z.string().nonempty(),
        participantId: z.string().nonempty(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input: { groupId, participantId }, ctx }) => {
      const { group, role: actorRole } =
        await ctx.groupService.ensureGroupMembership(groupId, ctx.user.id);

      if (actorRole !== GroupParticipantRole.ADMIN) {
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

      await ctx.groupService.deleteParticipant(group, participantId);
    }),
});
