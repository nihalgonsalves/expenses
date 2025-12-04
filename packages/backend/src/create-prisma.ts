import { PrismaPg } from "@prisma/adapter-pg";

import { config } from "./config.ts";
import { PrismaClient } from "./prisma/client.ts";

export const createPrisma = (connectionString = config.DATABASE_URL) =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
    omit: {
      user: { passwordHash: true, passwordResetToken: true },
    },
  });

export type PrismaClientType = ReturnType<typeof createPrisma>;
