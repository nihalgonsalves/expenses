-- The backend stored expenses as positive `expense` value before this commit.
-- This updates them. (The `expense_transactions` were correct)
UPDATE expenses
SET
  amount = - amount
WHERE
  type = 'EXPENSE'::expense_type;
