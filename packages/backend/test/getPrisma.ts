import { exec } from "child_process";
import { promisify } from "util";

import { beforeEach, inject } from "vitest";

import { createPrisma } from "../src/create-prisma.ts";

export const getPrisma = async () => {
  const postgresConnectionUri = new URL(inject("postgresConnectionUri"));
  postgresConnectionUri.pathname = `/expenses-${process.env["VITEST_WORKER_ID"]}`;

  await promisify(exec)(`yarn prisma db push`, {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      DATABASE_URL: postgresConnectionUri.toString(),
    },
  });

  const prisma = createPrisma(postgresConnectionUri.toString());

  beforeEach(async () => {
    const tablenames = await prisma.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== "_prisma_migrations")
      .map((name) => `"public"."${name}"`)
      .join(", ");

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  });

  return prisma;
};
