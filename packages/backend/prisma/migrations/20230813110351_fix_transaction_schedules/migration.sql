BEGIN;

ALTER TABLE "transaction_schedule"
DROP COLUMN "rrule_dtstart";

ALTER TABLE "transaction_schedule"
RENAME COLUMN "tz_id" TO "next_occurrence_tz_id";

-- `concurrently` is not supported by Prisma even if outside the transaction
CREATE UNIQUE INDEX "transactions_transaction_schedule_id_spent_at_key" ON "transactions" ("transaction_schedule_id", "spent_at");

COMMIT;
