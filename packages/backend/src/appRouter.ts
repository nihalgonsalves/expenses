import { z } from "zod";

import { config } from "./config.ts";
import { currencyConversionRouter } from "./service/frankfurter/currencyConversionRouter.ts";
import { notificationRouter } from "./service/notification/notificationRouter.ts";
import { sheetRouter } from "./service/sheet/sheetRouter.ts";
import { transactionRouter } from "./service/transaction/transactionRouter.ts";
import { userRouter } from "./service/user/userRouter.ts";
import { publicProcedure, router } from "./trpc.ts";
import { getErrorMessage } from "./utils/trpcUtils.ts";

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
  .output(
    z.object({
      name: z.string(),
      hasOauth: z.boolean(),
      oauthProviders: z.array(
        z.object({ provider: z.string(), name: z.string() }),
      ),
    }),
  )
  .query(() => ({
    name: config.APP_NAME,
    hasOauth: config.OAUTH_PROVIDER_CONFIG.length > 0,
    oauthProviders: config.OAUTH_PROVIDER_CONFIG.map((provider) => ({
      provider: provider.providerId,
      name: provider.name,
    })),
  }));

export const appRouter = router({
  health,
  config: configProcedure,
  user: userRouter,
  sheet: sheetRouter,
  transaction: transactionRouter,
  currencyConversion: currencyConversionRouter,
  notification: notificationRouter,
});

// inferred type of 'TrpcProvider' cannot be named without a reference to
// 'XXX' from '../../../backend/node_modules/@simplewebauthn/server/script'.
// This is likely not portable. A type annotation is necessary.
export type * from "@simplewebauthn/server";

export type AppRouter = typeof appRouter;
