BEGIN;

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "transaction_schedule_id" TEXT;

-- CreateTable
CREATE TABLE
  "transaction_schedule" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "type" "transaction_type" NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "scale" SMALLINT NOT NULL,
    "tz_id" TEXT NOT NULL,
    "rrule_dtstart" TIMESTAMP NOT NULL,
    "rrule_freq" TEXT NOT NULL,
    "next_occurrence_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "transaction_schedule_pkey" PRIMARY KEY ("id")
  );

-- AddForeignKey
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_transaction_schedule_id_fkey" FOREIGN KEY ("transaction_schedule_id") REFERENCES "transaction_schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_schedule"
ADD CONSTRAINT "transaction_schedule_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
