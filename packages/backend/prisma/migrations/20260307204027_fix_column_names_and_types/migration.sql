BEGIN;

-- AlterTable
ALTER TABLE "transactions"
ALTER COLUMN "spent_at"
SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users"
RENAME COLUMN "banExpires" TO "ban_expires";

ALTER TABLE "users"
RENAME COLUMN "banReason" TO "ban_reason";

ALTER TABLE "users"
ALTER COLUMN "ban_expires"
SET DATA TYPE TIMESTAMPTZ;

COMMIT;
