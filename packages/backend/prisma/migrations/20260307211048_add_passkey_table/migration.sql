BEGIN;

-- CreateTable
CREATE TABLE "passkey" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "name" TEXT,
  "public_key" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "credential_id" TEXT NOT NULL,
  "counter" INTEGER NOT NULL,
  "device_type" TEXT NOT NULL,
  "backed_up" BOOLEAN NOT NULL,
  "transports" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "aaguid" TEXT,
  CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passkey_user_id_idx" ON "passkey" ("user_id");

-- CreateIndex
CREATE INDEX "passkey_credential_id_idx" ON "passkey" ("credential_id");

-- AddForeignKey
ALTER TABLE "passkey"
ADD CONSTRAINT "passkey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
