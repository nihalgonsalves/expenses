import { z } from "zod";

import { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import {
  ZAuthorizeUserInput,
  ZUser,
  ZCreateUserInput,
  ZUpdateUserInput,
  ZResetPasswordInput,
  ZJWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { publicProcedure, protectedProcedure, router } from "../../trpc.ts";

export const userRouter = router({
  createUser: publicProcedure
    .input(ZCreateUserInput)
    .output(ZUser)
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await ctx.userService.createUser(input);
      await ctx.setJwtToken(token);
      return user;
    }),

  authorizeUser: publicProcedure
    .input(ZAuthorizeUserInput)
    .output(ZUser)
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await ctx.userService.authorize(input);
      await ctx.setJwtToken(token);
      return user;
    }),

  requestPasswordReset: publicProcedure
    .input(z.email())
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.userService.requestPasswordReset(input);
    }),

  resetPassword: publicProcedure
    .input(ZResetPasswordInput)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.userService.resetPassword(input.token, input.password);
    }),

  requestEmailVerification: protectedProcedure
    .input(z.void())
    .output(z.void())
    .mutation(async ({ ctx }) => {
      await ctx.userService.requestEmailVerification(ctx.user);
    }),

  verifyEmail: publicProcedure
    .input(ZJWTToken)
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ctx.userService.verifyEmail(input);
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
      await ctx.setJwtToken(null);
      return deletedId;
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.setJwtToken(null);
  }),

  me: protectedProcedure.output(ZUser).query(({ ctx }) => ctx.user),

  updateTheme: protectedProcedure
    .input(ZTheme)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      await ctx.userService.updateTheme(ctx.user.id, input);
    }),
});
