import { z } from 'zod';

export const ZUser = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
});
export type User = z.infer<typeof ZUser>;

export const ZJWTToken = z.string().brand<'JWTToken'>();
export type JWTToken = z.infer<typeof ZJWTToken>;

export const ZCreateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});
export type CreateUserInput = z.infer<typeof ZCreateUserInput>;

export const ZUpdateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1).optional(),
  newPassword: z.string().min(1).optional(),
});
export type UpdateUserInput = z.infer<typeof ZUpdateUserInput>;

export const ZAuthorizeUserInput = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type AuthorizeUserInput = z.infer<typeof ZAuthorizeUserInput>;

export const ZCategoryEmoji = z.object({
  id: z.string(),
  emojiShortCode: z.string().optional(),
});
