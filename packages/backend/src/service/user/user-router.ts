import { z } from "zod";

import { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import { ZUser } from "@nihalgonsalves/expenses-shared/types/user";

import { publicProcedure, protectedProcedure, router } from "../../trpc.ts";
import type { TestHelpers } from "better-auth/plugins";
import { config } from "../../config.ts";

export const userRouter = router({
  anonymizeUser: protectedProcedure
    .output(z.string())
    .mutation(async ({ ctx }) => {
      const deletedId = await ctx.userService.anonymizeUser(
        ctx.user.id,
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

  createTestUser: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.email(),
      }),
    )
    .output(
      z.object({
        user: ZUser.omit({ theme: true }),
        cookies: z.array(
          z.object({
            name: z.string(),
            value: z.string(),
            domain: z.string(),
            path: z.string(),
            httpOnly: z.boolean().optional(),
            secure: z.boolean().optional(),
            sameSite: z.enum(["Lax", "Strict", "None"]).optional(),
            expires: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!config.VITE_INTEGRATION_TEST) {
        throw new Error("createTestUser can only be used in integration tests");
      }

      // @ts-expect-error bad BetterAuth types, see plugins array.
      // oxlint-disable-next-line typescript/no-unsafe-assignment
      const testUtils: TestHelpers = (await ctx.betterAuth.$context).test;

      const user = await testUtils.saveUser(testUtils.createUser(input));

      const { cookies } = await testUtils.login({ userId: user.id });

      return { user, cookies };
    }),
});
