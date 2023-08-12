BEGIN;

-- manual
ALTER TABLE expense_transactions
RENAME TO transaction_entries;

ALTER TABLE expenses
RENAME TO transactions;

ALTER TABLE transaction_entries
RENAME COLUMN expense_id TO transaction_id;

ALTER TYPE expense_type
RENAME TO transaction_type;

-- prisma generated
-- AlterTable
ALTER TABLE "transaction_entries"
RENAME CONSTRAINT "expense_transactions_pkey" TO "transaction_entries_pkey";

-- AlterTable
ALTER TABLE "transactions"
RENAME CONSTRAINT "expenses_pkey" TO "transactions_pkey";

-- RenameForeignKey
ALTER TABLE "transaction_entries"
RENAME CONSTRAINT "expense_transactions_expense_id_fkey" TO "transaction_entries_transaction_id_fkey";

-- RenameForeignKey
ALTER TABLE "transaction_entries"
RENAME CONSTRAINT "expense_transactions_user_id_fkey" TO "transaction_entries_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "transactions"
RENAME CONSTRAINT "expenses_sheet_id_fkey" TO "transactions_sheet_id_fkey";

COMMIT;
