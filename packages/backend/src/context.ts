import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createContext = () => {
  return { prisma };
};

export type Context = Awaited<typeof createContext>;
