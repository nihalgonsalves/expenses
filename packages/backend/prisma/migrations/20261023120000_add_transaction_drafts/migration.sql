CREATE TYPE "transaction_draft_source" AS ENUM('APPLE_WALLET');

CREATE TABLE "transaction_drafts" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "user_id" TEXT NOT NULL,
  "source" "transaction_draft_source" NOT NULL,
  "raw_input" JSONB NOT NULL,
  "description" TEXT,
  "amount" INTEGER,
  "scale" SMALLINT,
  "currency_code" TEXT,
  "spent_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "transaction_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transaction_drafts_user_id_idx" ON "transaction_drafts" ("user_id");

ALTER TABLE "transaction_drafts"
ADD CONSTRAINT "transaction_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
