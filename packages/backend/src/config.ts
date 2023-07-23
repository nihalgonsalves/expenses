import { hostname } from 'os';

import { Temporal } from '@js-temporal/polyfill';
import { type ZodTypeAny, z } from 'zod';

const defaultSecret = 'test-secret';

const devOnlyDefault = <T extends ZodTypeAny>(
  type: T,
  defaultValue: T['_type'],
) => (IS_PROD ? type : type.default(defaultValue));

const ZEnv = z.object({
  PORT: z.coerce.number().default(5174),

  SECURE: z.coerce.boolean().default(IS_PROD ? true : false),
  JWT_SECRET: devOnlyDefault(z.string().nonempty(), defaultSecret),
  JWT_IDENTITY: z.string().default(`expenses-backend-${hostname()}`),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .default(Temporal.Duration.from({ days: 7 }).total('seconds')),

  FRANKFURTER_BASE_URL: devOnlyDefault(z.string(), 'http://localhost:5200/'),
});

export const config = ZEnv.parse(process.env);
