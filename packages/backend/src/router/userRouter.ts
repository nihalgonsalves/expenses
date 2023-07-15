import {
  ZAuthorizeUserInput,
  ZUser,
  ZCreateUserInput,
} from '../service/user/types';
import { publicProcedure, protectedProcedure, router } from '../trpc';

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

  signOut: publicProcedure.mutation(({ ctx }) => {
    ctx.setJwtToken(null);
  }),

  me: protectedProcedure.query(({ ctx }) => ctx.user),
});
