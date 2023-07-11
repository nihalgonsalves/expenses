import { PrismaClient } from '@prisma/client';
import type { inferAsyncReturnType } from '@trpc/server';

export const createContext = () => {
  return { prisma: new PrismaClient() };
};

export type Context = inferAsyncReturnType<typeof createContext>;
