/*
Warnings:

- You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
- You are about to drop the column `password_reset_token` on the `users` table. All the data in the column will be lost.

*/
BEGIN;

-- CreateTable
CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "token" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMPTZ,
  "refresh_token_expires_at" TIMESTAMPTZ,
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" ("token");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");

-- [Manual: Migrate Users]
INSERT INTO
  "accounts" (
    "account_id",
    "provider_id",
    "user_id",
    "password",
    "created_at",
    "updated_at"
  )
SELECT
  uuidv7(),
  'credential',
  id,
  password_hash,
  created_at,
  updated_at
FROM
  "users";

-- AlterTable
ALTER TABLE "users"
DROP COLUMN "password_hash",
DROP COLUMN "password_reset_token",
ADD COLUMN "image" TEXT,
ALTER COLUMN "id"
SET DEFAULT uuidv7();

-- AddForeignKey
ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
