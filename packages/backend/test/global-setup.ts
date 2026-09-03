/* oxlint-disable import/no-default-export */
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  const postgresContainer = await new PostgreSqlContainer("postgres:18-alpine")
    .withName(`vitest-expenses-backend-postgres`)
    .withReuse()
    .start();

  project.provide(
    "postgresConnectionUri",
    postgresContainer.getConnectionUri(),
  );

  return async () => {
    await postgresContainer.stop();
  };
}

declare module "vitest" {
  // oxlint-disable typescript/consistent-type-definitions
  export interface ProvidedContext {
    postgresConnectionUri: string;
  }
}
