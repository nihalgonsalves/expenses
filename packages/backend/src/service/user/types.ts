import { z } from 'zod';

export const ZUser = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
});

export type User = z.infer<typeof ZUser>;

export const ZJWTToken = z.string().brand<'JWTToken'>();
export type JWTToken = z.infer<typeof ZJWTToken>;

export const ZCreateUserInput = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});
export type CreateUserInput = z.infer<typeof ZCreateUserInput>;

export const ZAuthorizeUserInput = z.object({
  email: z.string(),
  password: z.string(),
});
export type AuthorizeUserInput = z.infer<typeof ZAuthorizeUserInput>;
