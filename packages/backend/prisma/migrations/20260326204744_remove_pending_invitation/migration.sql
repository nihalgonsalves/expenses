/*
Warnings:

- You are about to drop the `PendingInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN;

-- DropForeignKey
ALTER TABLE "PendingInvitation"
DROP CONSTRAINT "PendingInvitation_invited_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "PendingInvitation"
DROP CONSTRAINT "PendingInvitation_invited_to_sheet_id_fkey";

-- DropForeignKey
ALTER TABLE "PendingInvitation"
DROP CONSTRAINT "PendingInvitation_invited_user_id_fkey";

-- DropTable
DROP TABLE "PendingInvitation";

COMMIT;
