BEGIN;

-- CreateTable
CREATE TABLE "PendingInvitation" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "invited_by_user_id" TEXT NOT NULL,
  "invited_user_id" TEXT NOT NULL,
  "invited_to_sheet_id" TEXT NOT NULL,
  CONSTRAINT "PendingInvitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PendingInvitation"
ADD CONSTRAINT "PendingInvitation_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingInvitation"
ADD CONSTRAINT "PendingInvitation_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingInvitation"
ADD CONSTRAINT "PendingInvitation_invited_to_sheet_id_fkey" FOREIGN KEY ("invited_to_sheet_id") REFERENCES "sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
