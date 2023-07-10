import { z } from 'zod';

const ZEnv = z.object({
  NODE_ENV: z
    .union([z.literal('development'), z.literal('production')])
    .default('development'),

  PORT: z.coerce.number().default(5174),
});

export const config = ZEnv.parse(process.env);
