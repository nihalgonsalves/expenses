import { TRPCError, initTRPC } from '@trpc/server';

import { type ContextFn } from './context';

const t = initTRPC.context<ContextFn>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return next({
      ctx,
    });
  }),
);
