import type { JWTPayload } from "jose";
import { z } from "zod";

import {
  RESET_PASSWORD_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from "@nihalgonsalves/expenses-shared/routes";
import type {
  AuthorizeUserInput,
  User,
  CreateUserInput,
  JWTToken,
  UpdateUserInput,
} from "@nihalgonsalves/expenses-shared/types/user";

import { config } from "../../config.ts";
import type { PrismaClientType } from "../../create-prisma.ts";
import { Prisma } from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";
import { EmailWorkerError, type IEmailWorker } from "../email/EmailWorker.ts";

import {
  UserServiceError,
  comparePassword,
  hashPassword,
  signJWT,
  verifyJWT,
} from "./utils.ts";

const ZPasswordResetJWTPayload = z.object({
  purpose: z.literal("PASSWORD_RESET"),
  passwordResetToken: z.string(),
});

const ZVerifyEmailJWTPayload = z.object({
  purpose: z.literal("VERIFY_EMAIL"),
  email: z.email(),
});

export class UserService {
  private prismaClient: Pick<
    PrismaClientType,
    "$transaction" | "user" | "sheet" | "category"
  >;
  private emailWorker: IEmailWorker;

  constructor(
    prismaClient: Pick<
      PrismaClientType,
      "$transaction" | "user" | "sheet" | "category"
    >,
    emailWorker: IEmailWorker,
  ) {
    this.prismaClient = prismaClient;
    this.emailWorker = emailWorker;
  }

  async exchangeToken(token: JWTToken): Promise<{
    user: User;
    payload: JWTPayload;
    newToken: JWTToken | undefined;
  }> {
    const { payload, reissue } = await verifyJWT(token);

    if (!payload.sub) {
      throw new UserServiceError({
        message: "Invalid token",
        code: "FORBIDDEN",
      });
    }

    const user = await this.prismaClient.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UserServiceError({
        message: "Invalid token",
        code: "FORBIDDEN",
      });
    }

    return {
      user,
      payload,
      newToken: reissue ? await signJWT(user) : undefined,
    };
  }

  async authorize(
    input: AuthorizeUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    const user = await this.findByEmailIncludingSecureData(input.email);

    if (!user?.passwordHash) {
      throw new UserServiceError({
        message: "Invalid credentials",
        code: "FORBIDDEN",
      });
    }

    const passwordMatches = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UserServiceError({
        message: "Invalid credentials",
        code: "FORBIDDEN",
      });
    }

    if (user.passwordResetToken) {
      await this.prismaClient.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null },
      });
    }

    return {
      user,
      token: await signJWT(user),
    };
  }

  async createUser(
    input: CreateUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    try {
      const user = await this.prismaClient.user.create({
        data: {
          id: generateId(),
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password),
        },
      });

      return { user, token: await signJWT(user) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return this.authorize(input);
      }

      throw new UserServiceError({
        message: "Error signing up",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
      });
    }
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    if (input.newPassword != null) {
      if (input.password == null) {
        throw new UserServiceError({
          message: "The old password is required to set a new password",
          code: "BAD_REQUEST",
        });
      }

      await this.verifyPassword(
        id,
        // don't check against email because this mutation allows changing it too
        undefined,
        input.password,
      );
    }

    const user = await this.prismaClient.user.findUniqueOrThrow({
      where: { id },
    });

    const emailUnchanged = user.email === input.email;

    const updatedUser = await this.prismaClient.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        emailVerified: emailUnchanged ? user.emailVerified : false,
        passwordResetToken: null,
        ...(input.newPassword
          ? { passwordHash: await hashPassword(input.newPassword) }
          : {}),
      },
    });

    if (!emailUnchanged) {
      await this.requestEmailVerification(updatedUser);
    }

    return updatedUser;
  }

  async updateTheme(id: string, theme: string) {
    return this.prismaClient.user.update({
      where: { id },
      data: {
        theme,
      },
    });
  }

  async anonymizeUser(id: string, input: AuthorizeUserInput): Promise<string> {
    await this.verifyPassword(id, input.email, input.password);

    const [{ id: deletedId }] = await this.prismaClient.$transaction([
      this.prismaClient.user.update({
        where: { id },
        data: {
          name: "Deleted User",
          email: `deleted_${id}_${generateId()}@example.com`,
          passwordHash: null,
        },
      }),
      // TODO: access via sheetService
      this.prismaClient.sheet.deleteMany({
        where: {
          type: "PERSONAL",
          participants: { some: { participantId: id, role: "ADMIN" } },
        },
      }),
    ]);

    return deletedId;
  }

  async getCategories(user: User) {
    return this.prismaClient.category.findMany({
      where: { userId: user.id },
    });
  }

  async setCategoryEmojiShortCode(
    user: User,
    id: string,
    emojiShortCode: string | undefined,
  ) {
    const where = { id_userId: { id, userId: user.id } };

    if (emojiShortCode !== undefined) {
      return this.prismaClient.category.upsert({
        where,
        update: { emojiShortCode },
        create: { id, emojiShortCode, userId: user.id },
      });
    } else {
      await this.prismaClient.category.delete({
        where,
      });
      return undefined;
    }
  }

  async resetPassword(token: JWTToken, newPassword: string) {
    const { payload } = await verifyJWT(token);

    const parsedPayload = ZPasswordResetJWTPayload.safeParse(payload);

    if (!payload.sub || !parsedPayload.success) {
      throw new UserServiceError({
        message: "Invalid token",
        code: "FORBIDDEN",
      });
    }

    const user = await this.prismaClient.user.findUnique({
      where: {
        id: payload.sub,
        passwordResetToken: parsedPayload.data.passwordResetToken,
      },
    });

    if (!user) {
      throw new UserServiceError({
        message: "That reset link is invalid or expired",
        code: "FORBIDDEN",
      });
    }

    await this.prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        passwordHash: await hashPassword(newPassword),
        passwordResetToken: null,
      },
    });
  }

  async requestPasswordReset(emailAddress: string) {
    const user = await this.findByEmail(emailAddress);
    if (!user) {
      return;
    }

    const passwordResetToken = generateId();

    const token = await signJWT(user, {
      payload: {
        purpose: "PASSWORD_RESET",
        passwordResetToken,
      } satisfies z.infer<typeof ZPasswordResetJWTPayload>,
      expiry: { minutes: 15 },
    });

    const link = new URL(RESET_PASSWORD_ROUTE, config.PUBLIC_ORIGIN);
    link.searchParams.set("token", token);

    await this.prismaClient.user.update({
      where: { id: user.id },
      data: { passwordResetToken },
    });

    try {
      await this.emailWorker.sendEmail({
        to: {
          name: user.name,
          address: user.email,
        },
        subject: `Your reset password link for ${config.APP_NAME}`,
        text: [
          "Click here to reset your password:",
          link.toString(),
          "",
          "---",
          "If you did not request this reset, please ignore this email.",
        ].join("\n"),
      });
    } catch (error) {
      if (
        error instanceof EmailWorkerError &&
        error.code === "TOO_MANY_REQUESTS"
      ) {
        console.warn(
          "Skipping password reset email due to rate-limiting",
          user.id,
        );
        return;
      }

      throw error;
    }
  }

  async verifyEmail(token: JWTToken) {
    const { payload } = await verifyJWT(token);

    const parsedPayload = ZVerifyEmailJWTPayload.safeParse(payload);

    if (!payload.sub || !parsedPayload.success) {
      throw new UserServiceError({
        message: "Invalid token",
        code: "FORBIDDEN",
      });
    }

    const { email } = parsedPayload.data;

    const user = await this.prismaClient.user.findUnique({
      where: {
        id: payload.sub,
        email,
      },
    });

    if (!user) {
      throw new UserServiceError({
        message: "Please request a new verification link",
        code: "FORBIDDEN",
      });
    }

    await this.prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        emailVerified: true,
      },
    });
  }

  async requestEmailVerification(user: User) {
    const token = await signJWT(user, {
      payload: {
        purpose: "VERIFY_EMAIL",
        email: user.email,
      } satisfies z.infer<typeof ZVerifyEmailJWTPayload>,
      expiry: { hours: 24 },
    });

    const link = new URL(VERIFY_EMAIL_ROUTE, config.PUBLIC_ORIGIN);
    link.searchParams.set("token", token);

    await this.emailWorker.sendEmail({
      to: {
        name: user.name,
        address: user.email,
      },
      subject: `Your verification link for ${config.APP_NAME}`,
      text: [
        "Click here to verify your email:",
        link.toString(),
        "",
        "---",
        "If you did not request this link, please ignore this email.",
      ].join("\n"),
    });
  }

  private async findByEmail(email: string) {
    try {
      return await this.prismaClient.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new UserServiceError({
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
      });
    }
  }

  private async findByEmailIncludingSecureData(email: string) {
    try {
      return await this.prismaClient.user.findUnique({
        where: { email },
        omit: { passwordHash: false, passwordResetToken: false },
      });
    } catch (error) {
      throw new UserServiceError({
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
      });
    }
  }

  private async verifyPassword(
    userId: string,
    email: string | undefined,
    password: string,
  ) {
    const user = await this.prismaClient.user.findUnique({
      where: email ? { id: userId, email } : { id: userId },
      omit: { passwordHash: false },
    });

    if (!user) {
      throw new UserServiceError({
        message: "Invalid credentials",
        code: "FORBIDDEN",
      });
    }

    if (!user.passwordHash) {
      throw new UserServiceError({
        message: "Can't update or delete with no existing password",
        code: "BAD_REQUEST",
      });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UserServiceError({
        message: "Invalid credentials",
        code: "FORBIDDEN",
      });
    }
  }
}
