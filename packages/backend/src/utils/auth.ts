import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { createPrisma, type PrismaClientType } from "../create-prisma.ts";
import { config, IS_PROD } from "../config.ts";
import type { IEmailWorker } from "../service/email/EmailWorker.ts";
import { admin, genericOAuth } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import crypto from "node:crypto";

export const createAuth = (
  prismaClient: PrismaClientType,
  emailWorker: IEmailWorker,
) =>
  betterAuth({
    database: prismaAdapter(prismaClient, {
      provider: "postgresql",
      transaction: true,
    }),
    baseURL: config.PUBLIC_ORIGIN,
    basePath: "/api/auth",
    secret: config.JWT_SECRET,
    user: {
      changeEmail: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      password:
        config.VITEST_WORKER_ID && !IS_PROD
          ? {
              // scrypt is _really_ slow and slows down each test
              hash: async (password) =>
                crypto.createHash("sha256").update(password).digest("hex"),
              verify: async ({ password, hash }) =>
                crypto.createHash("sha256").update(password).digest("hex") ===
                hash,
            }
          : {},
      sendResetPassword: async ({ user, url }) => {
        void emailWorker.sendEmail({
          to: {
            name: user.name,
            address: user.email,
          },
          subject: `Your reset password link for ${config.APP_NAME}`,
          text: [
            "Click here to reset your password:",
            url,
            "",
            "---",
            "If you did not request this reset, please ignore this email.",
          ].join("\n"),
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        void emailWorker.sendEmail({
          to: {
            name: user.name,
            address: user.email,
          },
          subject: `Your verification link for ${config.APP_NAME}`,
          text: [
            "Click here to verify your email:",
            url,
            "",
            "---",
            "If you did not request this link, please ignore this email.",
          ].join("\n"),
        });
      },
    },
    experimental: {
      joins: true,
    },
    advanced: {
      trustedProxyHeaders: config.TRUSTED_PROXY_HEADERS,
      trustedOrigins: config.TRUSTED_ORIGINS,
      database: {
        generateId: false,
      },
    },
    plugins: [
      admin(),
      passkey(),
      genericOAuth({ config: config.OAUTH_PROVIDER_CONFIG }),
    ],
  });

/** @lintignore for the CLI - should not be used in the app */
export const auth: unknown = config.BETTER_AUTH_CLI
  ? createAuth(createPrisma(), { sendEmail: async () => Promise.resolve() })
  : undefined;

export type BetterAuthInstance = ReturnType<typeof createAuth>;
