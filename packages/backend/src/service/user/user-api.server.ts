import { z } from "zod";

import type { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import {
  ZCategoryGroup,
  ZCreateCategoryGroupInput,
  ZUpdateCategoryGroupInput,
} from "@nihalgonsalves/expenses-shared/types/category-group";
import { ZUser } from "@nihalgonsalves/expenses-shared/types/user";

import { config } from "../../config.ts";
import type { ContextObj } from "../../context.ts";
import type { TestHelpers } from "better-auth/plugins";

type AuthenticatedContext = ContextObj & {
  user: NonNullable<ContextObj["user"]>;
};

export const getCurrentUser = (ctx: AuthenticatedContext) =>
  ZUser.parse(ctx.user);

export const signOut = async (ctx: ContextObj) => {
  ctx.clearSiteData();
};

export const anonymizeUser = async (ctx: AuthenticatedContext) => {
  const deletedId = await ctx.userService.anonymizeUser(
    ctx.user.id,
    ctx.headers,
  );
  ctx.clearSiteData();
  return z.string().parse(deletedId);
};

export const updateTheme = async (
  ctx: AuthenticatedContext,
  input: z.output<typeof ZTheme>,
) => {
  await ctx.userService.updateTheme(ctx.user.id, input);
};

export const getCategoryGroups = async (ctx: AuthenticatedContext) =>
  z
    .array(ZCategoryGroup)
    .parse(await ctx.userService.getCategoryGroups(ctx.user));

export const createCategoryGroup = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZCreateCategoryGroupInput>,
) =>
  ZCategoryGroup.parse(
    await ctx.userService.createCategoryGroup(
      ctx.user,
      ZCreateCategoryGroupInput.parse(input),
    ),
  );

export const updateCategoryGroup = async (
  ctx: AuthenticatedContext,
  input: z.input<typeof ZUpdateCategoryGroupInput>,
) =>
  ZCategoryGroup.parse(
    await ctx.userService.updateCategoryGroup(
      ctx.user,
      ZUpdateCategoryGroupInput.parse(input),
    ),
  );

export const deleteCategoryGroup = async (
  ctx: AuthenticatedContext,
  id: string,
) => {
  await ctx.userService.deleteCategoryGroup(
    ctx.user,
    z.string().min(1).parse(id),
  );
};

const ZCreateTestUserInput = z.object({
  name: z.string(),
  email: z.email(),
});

export const createTestUser = async (
  ctx: ContextObj,
  input: z.output<typeof ZCreateTestUserInput>,
) => {
  if (!config.VITE_INTEGRATION_TEST) {
    throw new Error("createTestUser can only be used in integration tests");
  }

  // @ts-expect-error bad BetterAuth types, see plugins array.
  // oxlint-disable-next-line typescript/no-unsafe-assignment
  const testUtils: TestHelpers = (await ctx.betterAuth.$context).test;
  const user = await testUtils.saveUser(testUtils.createUser(input));
  const { cookies } = await testUtils.login({ userId: user.id });

  return { user: ZUser.omit({ theme: true }).parse(user), cookies };
};
