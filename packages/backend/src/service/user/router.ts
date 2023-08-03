import { z } from 'zod';

import { publicProcedure, protectedProcedure, router } from '../../trpc';

import {
  ZAuthorizeUserInput,
  ZUser,
  ZCreateUserInput,
  ZUpdateUserInput,
} from './types';

export const userRouter = router({
  createUser: publicProcedure
    .input(ZCreateUserInput)
    .output(ZUser)
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await ctx.userService.createUser(input);
      ctx.setJwtToken(token);
      return user;
    }),

  authorizeUser: publicProcedure
    .input(ZAuthorizeUserInput)
    .output(ZUser)
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await ctx.userService.authorize(input);
      ctx.setJwtToken(token);
      return user;
    }),

  updateUser: protectedProcedure
    .input(ZUpdateUserInput)
    .output(ZUser)
    .mutation(async ({ input, ctx }) =>
      ctx.userService.updateUser(ctx.user.id, input),
    ),

  anonymizeUser: protectedProcedure
    .input(ZAuthorizeUserInput)
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      const deletedId = await ctx.userService.anonymizeUser(ctx.user.id, input);
      ctx.setJwtToken(null);
      return deletedId;
    }),

  signOut: publicProcedure.mutation(({ ctx }) => {
    ctx.setJwtToken(null);
  }),

  me: protectedProcedure.output(ZUser).query(({ ctx }) => ctx.user),
});
