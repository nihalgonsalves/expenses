BEGIN;

-- users
ALTER TABLE "User"
RENAME TO "users";

ALTER TABLE "users"
RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "users"
RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "users"
RENAME COLUMN "passwordHash" TO "password_hash";

ALTER TABLE "users"
RENAME CONSTRAINT "User_pkey" TO "users_pkey";

ALTER INDEX "User_email_key"
RENAME TO "users_email_key";

-- groups
ALTER TABLE "Group"
RENAME TO "groups";

ALTER TABLE "groups"
RENAME CONSTRAINT "Group_pkey" TO "groups_pkey";

ALTER TABLE "groups"
RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "groups"
RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "groups"
RENAME COLUMN "currencyCode" TO "currency_code";

-- group_participants
ALTER TABLE "GroupParticipants"
RENAME TO "group_memberships";

ALTER TABLE "group_memberships"
RENAME CONSTRAINT "GroupParticipants_pkey" TO "group_memberships_pkey";

ALTER TABLE "group_memberships"
RENAME CONSTRAINT "GroupParticipants_groupId_fkey" TO "group_memberships_group_id_fkey";

ALTER TABLE "group_memberships"
RENAME CONSTRAINT "GroupParticipants_participantId_fkey" TO "group_memberships_participant_id_fkey";

ALTER TABLE "group_memberships"
RENAME COLUMN "groupId" TO "group_id";

ALTER TABLE "group_memberships"
RENAME COLUMN "joinedAt" TO "joined_at";

ALTER TABLE "group_memberships"
RENAME COLUMN "participantId" TO "participant_id";

-- expenses
ALTER TABLE "Expense"
RENAME TO "expenses";

ALTER TABLE "expenses"
RENAME CONSTRAINT "Expense_pkey" TO "expenses_pkey";

ALTER TABLE "expenses"
RENAME CONSTRAINT "Expense_groupId_fkey" TO "expenses_group_id_fkey";

ALTER TABLE "expenses"
RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "expenses"
RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "expenses"
RENAME COLUMN "groupId" TO "group_id";

ALTER TABLE "expenses"
RENAME COLUMN "spentAt" TO "spent_at";

-- expense_transactions
ALTER TABLE "ExpenseTransactions"
RENAME TO "expense_transactions";

ALTER TABLE "expense_transactions"
RENAME CONSTRAINT "ExpenseTransactions_pkey" TO "expense_transactions_pkey";

ALTER TABLE "expense_transactions"
RENAME CONSTRAINT "ExpenseTransactions_expenseId_fkey" TO "expense_transactions_expense_id_fkey";

ALTER TABLE "expense_transactions"
RENAME CONSTRAINT "ExpenseTransactions_userId_fkey" TO "expense_transactions_user_id_fkey";

ALTER TABLE "expense_transactions"
RENAME COLUMN "expenseId" TO "expense_id";

ALTER TABLE "expense_transactions"
RENAME COLUMN "userId" TO "user_id";

COMMIT;
