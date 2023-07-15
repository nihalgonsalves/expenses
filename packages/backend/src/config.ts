import { hostname } from 'os';

import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

const defaultSecret = 'test-secret';

const ZEnv = z.object({
  PORT: z.coerce.number().default(5174),

  SECURE: z.coerce.boolean().default(IS_PROD ? true : false),
  JWT_SECRET: z.string().default(defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total('seconds')),
});

export const config = ZEnv.parse(process.env);

if (IS_PROD && config.JWT_SECRET === defaultSecret) {
  throw new Error('ERROR: env JWT_SECRET is not set in production!');
}
