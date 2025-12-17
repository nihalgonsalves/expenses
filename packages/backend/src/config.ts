import { hostname } from "os";

import { Temporal } from "temporal-polyfill";
import { default as webPush } from "web-push";
import { z } from "zod";

const defaultSecret = "test-secret";

export const IS_PROD = process.env["NODE_ENV"] === "production";

const devOnlyDefault = <T extends z.ZodType>(
  type: T,
  defaultValue: z.output<T> extends undefined ? never : z.output<T>,
) => (IS_PROD ? type : type.default(defaultValue));

const DEV_VAPID_KEYS = webPush.generateVAPIDKeys();

const ZEnv = z.object({
  GIT_COMMIT_SHA: z.string().default("unknown"),

  LISTEN_HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().default(5174),
  PUBLIC_ORIGIN: devOnlyDefault(
    z.url({ protocol: /^https?$/ }),
    "http://localhost:5173",
  ),
  APP_NAME: z.string().default("Expenses"),

  SMTP_HOST: devOnlyDefault(z.string(), "localhost"),
  SMTP_PORT: devOnlyDefault(z.coerce.number(), 1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: devOnlyDefault(z.email(), "expenses@example.com"),

  SECURE: z.coerce.boolean().default(IS_PROD),
  JWT_SECRET: devOnlyDefault(z.string().min(1), defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total("seconds")),

  VAPID_EMAIL: devOnlyDefault(z.email(), "nobody@example.com"),
  VAPID_PRIVATE_KEY: devOnlyDefault(
    z.string().min(1),
    DEV_VAPID_KEYS.privateKey,
  ),
  VAPID_PUBLIC_KEY: devOnlyDefault(z.string().min(1), DEV_VAPID_KEYS.publicKey),

  DATABASE_URL: devOnlyDefault(
    z.url(),
    "postgresql://postgres:postgres@localhost:5432/postgres",
  ),
  REDIS_URL: devOnlyDefault(z.url(), "redis://localhost:6379/0"),
  FRANKFURTER_BASE_URL: devOnlyDefault(
    z.url({ protocol: /^https?$/ }),
    "http://localhost:5200/",
  ),

  ENABLE_ADMIN: z.coerce.boolean().default(!IS_PROD),

  SENTRY_DSN: z.string().optional(),
});

export const NOTIFICATION_BULLMQ_QUEUE = "notifications";
export const TRANSACTION_SCHEDULE_BULLMQ_QUEUE = "transaction-schedules";
export const EMAIL_BULLMQ_QUEUE = "emails";

export const config = ZEnv.parse(process.env);
