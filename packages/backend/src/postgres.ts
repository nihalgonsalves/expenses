import { createPostgresBackend, runMigrations } from "bullmq";
import { Pool } from "pg";

export const createBullMQPool = (connectionString: string) =>
  new Pool({
    connectionString,
    options: "-c search_path=bullmq,public",
  });

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
