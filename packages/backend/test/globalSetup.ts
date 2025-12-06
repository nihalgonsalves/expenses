/* eslint-disable import/no-default-export */
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer } from "@testcontainers/redis";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  const [postgresContainer, redisContainer] = await Promise.all([
    new PostgreSqlContainer("postgres:17-alpine")
      .withName(`vitest-expenses-backend-postgres`)
      .withReuse()
      .start(),
    new RedisContainer("redis:7-alpine")
      .withName(`vitest-expenses-backend-redis`)
      .withReuse()
      .start(),
  ]);

  project.provide(
    "postgresConnectionUri",
    postgresContainer.getConnectionUri(),
  );

  project.provide("redisConnectionUri", redisContainer.getConnectionUrl());

  return async () => {
    await Promise.all([postgresContainer.stop(), redisContainer.stop()]);
  };
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface ProvidedContext {
    postgresConnectionUri: string;
    redisConnectionUri: string;
  }
}
