import { initTRPC } from '@trpc/server';

export const { router, procedure: publicProcedure } = initTRPC.create();
