import { z } from "zod";

import { config } from "./config.ts";
import { currencyConversionRouter } from "./service/frankfurter/currencyConversionRouter.ts";
import { notificationRouter } from "./service/notification/notificationRouter.ts";
import { sheetRouter } from "./service/sheet/sheetRouter.ts";
import { transactionRouter } from "./service/transaction/transactionRouter.ts";
import { userRouter } from "./service/user/userRouter.ts";
import { publicProcedure, router } from "./trpc.ts";
import { getErrorMessage } from "./utils/trpcUtils.ts";

// HACK: fix for this error on the frontend:
//  The inferred type of 'useTRPC' cannot be named without a reference to
//  '../../../../node_modules/@trpc/server/dist/unstable-core-do-not-import.d-BJCeJk5P.cjs'.
//  This is likely not portable. A type annotation is necessary.
// Note that this seems to be fixed in tsgo, it could be unnecessary when TypeScript v7 is out.
export type * from "@trpc/server";

const health = publicProcedure.query(async ({ ctx }) => {
  try {
    const response = await ctx.prisma.$queryRaw`SELECT 1 as one`;

    z.array(z.object({ one: z.literal(1) })).parse(response);

    return { status: "ok", message: "healthy" };
  } catch (e) {
    return {
      status: "error",
      message: getErrorMessage(e),
    };
  }
});

const configProcedure = publicProcedure
  .input(z.void())
  .output(z.object({ name: z.string() }))
  .query(() => ({ name: config.APP_NAME }));

export const appRouter = router({
  health,
  config: configProcedure,
  user: userRouter,
  sheet: sheetRouter,
  transaction: transactionRouter,
  currencyConversion: currencyConversionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
