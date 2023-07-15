import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ZCreateGroupInput,
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
    .input(z.string())
    .output(ZGroupByIdResponse)
    .query(async ({ input, ctx }) => {
      const group = await ctx.groupService.getGroupById(input, ctx.user);

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      return {
        ...group,
        participants: group.participants.map(({ participant, role }) => ({
          ...participant,
          role,
        })),
      };
    }),

  createGroup: protectedProcedure
    .input(ZCreateGroupInput)
    .mutation(async ({ input, ctx }) =>
      ctx.groupService.createGroup(input, ctx.user),
    ),

  deleteGroup: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await ctx.groupService.deleteGroup(input, ctx.user);
    }),
});
