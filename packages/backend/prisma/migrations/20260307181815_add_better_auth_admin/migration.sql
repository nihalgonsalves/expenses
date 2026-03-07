BEGIN;

-- AlterTable
ALTER TABLE "sessions"
ADD COLUMN "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "banExpires" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT,
ADD COLUMN "banned" BOOLEAN DEFAULT false,
ADD COLUMN "role" TEXT;

COMMIT;
