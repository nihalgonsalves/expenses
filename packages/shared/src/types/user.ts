import { z } from "zod";

export const ZUser = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  theme: z.string().nullable(),
});

export type User = z.infer<typeof ZUser>;

export const ZJWTToken = z.string();
export type JWTToken = z.infer<typeof ZJWTToken>;

export const ZCreateUserInput = z.object({
  name: z.string().min(1, {
    message: "Name cannot be empty",
  }),
  email: z.email({
    message: "Invalid email",
  }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type CreateUserInput = z.infer<typeof ZCreateUserInput>;

export const ZUpdateUserInput = z
  .object({
    name: z.string().min(1, {
      message: "Name cannot be empty",
    }),
    email: z.email({
      message: "Invalid email",
    }),
    password: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .refine((data) => {
    if (
      data.password &&
      data.newPassword &&
      data.password !== data.newPassword
    ) {
      return true;
    }

    if (!data.password && !data.newPassword) {
      return true;
    }

    if (!data.password && data.newPassword) {
      return {
        message: "The old password is required to set a new password",
        path: ["password"],
      };
    }

    if (data.password && !data.newPassword) {
      return {
        message: "You must set both your old and new password, or neither",
        path: ["password"],
      };
    }

    return {
      message: "The new password cannot be the same",
      path: ["newPassword"],
    };
  });
export type UpdateUserInput = z.infer<typeof ZUpdateUserInput>;

export const ZResetPasswordInput = z.object({
  token: ZJWTToken,
  password: z.string().min(1, { message: "Password is required" }),
});
export type ResetPasswordInput = z.infer<typeof ZResetPasswordInput>;

export const ZAuthorizeUserInput = z.object({
  email: z.email({
    message: "Invalid email",
  }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type AuthorizeUserInput = z.infer<typeof ZAuthorizeUserInput>;

export const ZCategoryEmoji = z.object({
  id: z.string(),
  emojiShortCode: z.string().optional(),
});
