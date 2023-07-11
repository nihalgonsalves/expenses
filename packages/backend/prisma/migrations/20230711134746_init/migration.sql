-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT 'gen_random_uuid()',
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
