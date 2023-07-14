import { hostname } from 'os';

import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

const defaultSecret = 'test-secret';

const ZNodeEnv = z
  .union([z.literal('test'), z.literal('development'), z.literal('production')])
  .default('development');

const nodeEnv = ZNodeEnv.parse(process.env['NODE_ENV']);

const ZEnv = z.object({
  NODE_ENV: ZNodeEnv,

  PORT: z.coerce.number().default(5174),

  SECURE: z.coerce.boolean().default(nodeEnv === 'production' ? true : false),
  JWT_SECRET: z.string().default(defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total('seconds')),
});

export const config = ZEnv.parse(process.env);

if (config.NODE_ENV === 'production' && config.JWT_SECRET === defaultSecret) {
  throw new Error('ERROR: env JWT_SECRET is not set in production!');
}
