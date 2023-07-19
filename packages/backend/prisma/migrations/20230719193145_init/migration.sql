-- CreateEnum
CREATE TYPE "GroupParticipantRole" AS ENUM('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM('EXPENSE', 'TRANSFER');

-- CreateTable
CREATE TABLE
  "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE
  "Group" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "name" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE
  "GroupParticipants" (
    "participantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "GroupParticipantRole" NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT "GroupParticipants_pkey" PRIMARY KEY ("participantId", "groupId")
  );

-- CreateTable
CREATE TABLE
  "Expense" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE',
    "groupId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "scale" SMALLINT NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE
  "ExpenseTransactions" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "scale" SMALLINT NOT NULL,
    CONSTRAINT "ExpenseTransactions_pkey" PRIMARY KEY ("id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- AddForeignKey
ALTER TABLE "GroupParticipants"
ADD CONSTRAINT "GroupParticipants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupParticipants"
ADD CONSTRAINT "GroupParticipants_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseTransactions"
ADD CONSTRAINT "ExpenseTransactions_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseTransactions"
ADD CONSTRAINT "ExpenseTransactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
