import { PrismaClient } from '@prisma/client';

import { UserService } from './service/UserService';

const prisma = new PrismaClient();

export const createContext = () => {
  return { prisma, userService: new UserService(prisma) };
};

export type Context = Awaited<typeof createContext>;
