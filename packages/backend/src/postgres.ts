import {
  createPostgresBackend,
  isPgPool,
  runMigrations,
  type PgPool,
} from "bullmq";
import { Pool } from "pg";

export const createBullMQPool = (connectionString: string) =>
  new Pool({
    connectionString,
    options: "-c search_path=bullmq,public",
  });

// `pg.Pool` is not structurally assignable to BullMQ's `PgPool` (the overloaded
// `on` signatures differ from @types/pg's), so narrow it with BullMQ's own guard
export const toBullMQConnection = (pool: Pool): PgPool => {
  if (!isPgPool(pool)) {
    throw new Error("Expected a pg.Pool instance");
  }
  return pool;
};

export const migrateBullMQ = async (pool: Pool) => {
  const client = await pool.connect();
  try {
    await runMigrations(client);
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_rate_limits (
        key varchar(255) PRIMARY KEY,
        points integer NOT NULL DEFAULT 0,
        expire bigint
      )
    `);
  } finally {
    client.release();
  }
};

export { createPostgresBackend };
