BEGIN;

-- CreateTable
CREATE TABLE
  "notification_subscriptions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "key_auth" TEXT NOT NULL,
    "key_p256dh" TEXT NOT NULL,
    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "notification_subscriptions_endpoint_key" ON "notification_subscriptions" ("endpoint");

-- AddForeignKey
ALTER TABLE "notification_subscriptions"
ADD CONSTRAINT "notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
