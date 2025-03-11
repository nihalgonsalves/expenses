import { hostname } from "os";

import { type ZodTypeAny, z } from "zod";

const defaultSecret = "test-secret";

export const IS_PROD = process.env["NODE_ENV"] === "production";

const devOnlyDefault = <T extends ZodTypeAny>(
  type: T,
  defaultValue: T["_type"],
) => (IS_PROD ? type : type.default(defaultValue));

const ZEnv = z.object({
  GIT_COMMIT_SHA: z.string().default("unknown"),

  LISTEN_HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().default(5174),
  PUBLIC_ORIGIN: devOnlyDefault(z.string().url(), "http://localhost:5173"),
  APP_NAME: z.string().default("Expenses"),

  SMTP_HOST: devOnlyDefault(z.string(), "localhost"),
  SMTP_PORT: devOnlyDefault(z.coerce.number(), 1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: devOnlyDefault(z.string().email(), "expenses@example.com"),

  SECURE: z.coerce.boolean().default(IS_PROD),
  JWT_SECRET: devOnlyDefault(z.string().min(1), defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total("seconds")),

  VAPID_EMAIL: devOnlyDefault(z.string().email(), "nobody@example.com"),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),

  REDIS_URL: devOnlyDefault(z.string().url(), "redis://localhost:6379/0"),
  FRANKFURTER_BASE_URL: devOnlyDefault(z.string(), "http://localhost:5200/"),

  ENABLE_ADMIN: z.coerce.boolean().default(!IS_PROD),

  SENTRY_DSN: z.string().optional(),
});

export const NOTIFICATION_BULLMQ_QUEUE = "notifications";
export const TRANSACTION_SCHEDULE_BULLMQ_QUEUE = "transaction-schedules";
export const EMAIL_BULLMQ_QUEUE = "emails";

export const config = ZEnv.parse(process.env);
