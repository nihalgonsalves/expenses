import { z } from 'zod';

export type User = { id: string; name: string; email: string };

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

export const ZJWTToken = z.string().brand<'JWTToken'>();
export type JWTToken = z.infer<typeof ZJWTToken>;
