import * as Sentry from "@sentry/node";
import { TRPCError, initTRPC } from "@trpc/server";
import { z, ZodError } from "zod";

import type { ContextFn } from "./context.ts";

export const t = initTRPC.context<ContextFn>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? z.treeifyError(error.cause)
            : null,
      },
    };
  },
});

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: false,
  }),
);

export const router = t.router;
export const publicProcedure = t.procedure.use(sentryMiddleware);

export const protectedProcedure = t.procedure.use(sentryMiddleware).use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: { ...ctx, user: ctx.user },
    });
  }),
);
