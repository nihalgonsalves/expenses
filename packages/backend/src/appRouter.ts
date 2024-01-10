import { z } from "zod";

import { config } from "./config";
import { currencyConversionRouter } from "./service/frankfurter/currencyConversionRouter";
import { notificationRouter } from "./service/notification/notificationRouter";
import { sheetRouter } from "./service/sheet/sheetRouter";
import { transactionRouter } from "./service/transaction/transactionRouter";
import { userRouter } from "./service/user/userRouter";
import { publicProcedure, router } from "./trpc";
import { getErrorMessage } from "./utils/trpcUtils";

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
