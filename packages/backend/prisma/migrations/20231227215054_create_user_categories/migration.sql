-- CreateTable
CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "user_id" TEXT NOT NULL,
  "emoji_short_code" TEXT NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id", "user_id")
);

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories" ("user_id");

-- AddForeignKey
ALTER TABLE "categories"
ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
