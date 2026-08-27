BEGIN;

-- Better Auth 1.7 does not support UUID verification IDs, they are base64url hashes
ALTER TABLE "verifications"
ALTER COLUMN "id"
DROP DEFAULT,
ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT,
ALTER COLUMN "id"
SET DEFAULT uuidv7();

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "issuer" TEXT;

-- Better Auth 1.7 keys credential accounts by the linked user's stable ID.
UPDATE "accounts"
SET
  "issuer" = 'local:credential',
  "account_id" = "user_id"
WHERE
  "provider_id" = 'credential';

-- Preserve the OIDC identity exactly as asserted by the provider
WITH
  encoded_claims AS (
    SELECT
      "id",
      split_part("id_token", '.', 2) AS payload
    FROM
      "accounts"
    WHERE
      "provider_id" <> 'credential'
  ),
  decoded_claims AS (
    SELECT
      "id",
      convert_from(
        decode(
          rpad(
            translate(payload, '-_', '+/'),
            ((length(payload) + 3) / 4) * 4,
            '='
          ),
          'base64'
        ),
        'UTF8'
      )::JSONB AS claims
    FROM
      encoded_claims
  )
UPDATE "accounts" AS account
SET
  "issuer" = decoded.claims ->> 'iss',
  "account_id" = decoded.claims ->> 'sub'
FROM
  decoded_claims AS decoded
WHERE
  account."id" = decoded."id";

-- Refuse to finalize if an existing token did not contain usable identity
-- claims or if another account provider needs an explicit migration rule.
DO $$
BEGIN
  IF EXISTS (
    SELECT
      1
    FROM
      "accounts"
    WHERE
      "issuer" IS NULL
      OR "account_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Could not derive issuer and account ID for every account';
  END IF;
END
$$;

-- Check identity collisions before creating the Better Auth 1.7 key.
DO $$
BEGIN
  IF EXISTS (
    SELECT
      1
    FROM
      "accounts"
    GROUP BY
      "issuer",
      "account_id"
    HAVING
      COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate issuer/account_id identities must be resolved before applying this migration';
  END IF;
END
$$;

ALTER TABLE "accounts"
ALTER COLUMN "issuer"
SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_issuer_account_id_key" ON "accounts" ("issuer", "account_id");

COMMIT;
