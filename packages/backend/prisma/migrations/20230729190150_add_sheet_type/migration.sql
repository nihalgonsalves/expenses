BEGIN;

CREATE TYPE "sheet_type" AS ENUM('PERSONAL', 'GROUP');

-- sheets
ALTER TABLE "groups"
RENAME TO "sheets";

ALTER TABLE "sheets"
ADD COLUMN "type" "sheet_type";

UPDATE "sheets"
SET
  "type" = 'GROUP'::"sheet_type";

ALTER TABLE "sheets"
ALTER COLUMN "type"
SET NOT NULL;

ALTER TABLE "sheets"
RENAME CONSTRAINT "groups_pkey" TO "sheets_pkey";

-- sheet_memberships
ALTER TABLE "group_memberships"
RENAME TO "sheet_memberships";

ALTER TABLE "sheet_memberships"
RENAME COLUMN "group_id" TO "sheet_id";

ALTER TABLE "sheet_memberships"
RENAME CONSTRAINT "group_memberships_pkey" TO "sheet_memberships_pkey";

ALTER TABLE "sheet_memberships"
RENAME CONSTRAINT "group_memberships_group_id_fkey" TO "sheet_memberships_sheet_id_fkey";

ALTER TABLE "sheet_memberships"
RENAME CONSTRAINT "group_memberships_participant_id_fkey" TO "sheet_memberships_participant_id_fkey";

-- expenses
ALTER TABLE "expenses"
RENAME COLUMN "group_id" TO "sheet_id";

ALTER TABLE "expenses"
RENAME CONSTRAINT "expenses_group_id_fkey" TO "expenses_sheet_id_fkey";

-- types
ALTER TYPE "GroupParticipantRole"
RENAME TO "sheet_participant_role";

ALTER TYPE "ExpenseType"
RENAME TO "expense_type";

COMMIT;
