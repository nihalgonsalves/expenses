CREATE TABLE "category_groups" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "categories" TEXT[] NOT NULL,
  CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "category_groups_user_id_idx" ON "category_groups" ("user_id");

ALTER TABLE "category_groups"
ADD CONSTRAINT "category_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
