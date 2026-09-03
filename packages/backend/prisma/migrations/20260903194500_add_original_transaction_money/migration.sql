ALTER TABLE "transactions"
ADD COLUMN "original_amount" INTEGER,
ADD COLUMN "original_scale" SMALLINT,
ADD COLUMN "original_currency_code" TEXT,
ADD CONSTRAINT "transactions_original_money_all_or_none" CHECK (
  (
    "original_amount" IS NULL
    AND "original_scale" IS NULL
    AND "original_currency_code" IS NULL
  )
  OR (
    "original_amount" IS NOT NULL
    AND "original_scale" IS NOT NULL
    AND "original_currency_code" IS NOT NULL
  )
);
