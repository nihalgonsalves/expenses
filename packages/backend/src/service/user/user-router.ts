import { z } from "zod";

import { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import {
  ZAuthorizeUserInput,
  ZUser,
} from "@nihalgonsalves/expenses-shared/types/user";

import { publicProcedure, protectedProcedure, router } from "../../trpc.ts";

export const userRouter = router({
  anonymizeUser: protectedProcedure
    .input(ZAuthorizeUserInput.omit({ email: true }))
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      const deletedId = await ctx.userService.anonymizeUser(
        ctx.user.id,
        input,
        ctx.headers,
      );
      ctx.clearSiteData();
      return deletedId;
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    ctx.clearSiteData();
  }),

  me: protectedProcedure.output(ZUser).query(({ ctx }) => ctx.user),

  updateTheme: protectedProcedure
    .input(ZTheme)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      await ctx.userService.updateTheme(ctx.user.id, input);
    }),
});
