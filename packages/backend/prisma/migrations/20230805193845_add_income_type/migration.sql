BEGIN;

-- AlterEnum
ALTER TYPE "expense_type"
ADD VALUE 'INCOME';

-- AlterTable
ALTER TABLE "expenses"
ALTER COLUMN "type"
DROP DEFAULT;

-- Flip group sheet expense transactions
UPDATE expense_transactions
SET
  amount = - amount
WHERE
  id IN (
    SELECT
      expense_transactions.id
    FROM
      expense_transactions
      INNER JOIN expenses ON expenses.id = expense_transactions.expense_id
      INNER JOIN sheets on sheets.id = expenses.sheet_id
    WHERE
      sheets.type = 'GROUP'::sheet_type
  );

COMMIT;
