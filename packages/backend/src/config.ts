import { hostname } from 'os';

import { Temporal } from '@js-temporal/polyfill';
import { type ZodTypeAny, z } from 'zod';

const defaultSecret = 'test-secret';

const devOnlyDefault = <T extends ZodTypeAny>(
  type: T,
  defaultValue: T['_type'],
) => (IS_PROD ? type : type.default(defaultValue));

const ZEnv = z.object({
  LISTEN_HOST: z.string().nonempty().default('0.0.0.0'),
  PORT: z.coerce.number().default(5174),

  SECURE: z.coerce.boolean().default(IS_PROD),
  JWT_SECRET: devOnlyDefault(z.string().nonempty(), defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total('seconds')),

  VAPID_EMAIL: devOnlyDefault(z.string().email(), 'nobody@example.com'),
  VAPID_PRIVATE_KEY: z.string().nonempty(),
  VAPID_PUBLIC_KEY: z.string().nonempty(),

  REDIS_URL: devOnlyDefault(z.string().url(), 'redis://localhost:6379/0'),
  FRANKFURTER_BASE_URL: devOnlyDefault(z.string(), 'http://localhost:5200/'),

  ENABLE_ADMIN: z.coerce.boolean().default(!IS_PROD),
});

export const NOTIFICATION_BULLMQ_QUEUE = 'notifications';

export const config = ZEnv.parse(process.env);
