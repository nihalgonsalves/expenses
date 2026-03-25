import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { createPrisma, type PrismaClientType } from "../create-prisma.ts";
import { config, IS_PROD } from "../config.ts";
import type { IEmailWorker } from "../service/email/email-worker.ts";
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
        const fn = async () => {
          const pendingInvitation =
            await prismaClient.pendingInvitation.findFirst({
              where: {
                invitedUserId: user.id,
              },
              include: {
                invitedToSheet: {
                  select: {
                    name: true,
                  },
                },
                invitedByUser: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            });

          if (pendingInvitation) {
            await emailWorker.sendEmail({
              to: {
                name: user.name,
                address: user.email,
              },
              subject: `Share expenses for "${pendingInvitation.invitedToSheet.name}" with ${pendingInvitation.invitedByUser.name}`,
              text: [
                `You've been invited by ${pendingInvitation.invitedByUser.name} to join the "${pendingInvitation.invitedToSheet.name}" sheet on ${config.APP_NAME}.`,
                "",
                "Click here to set your password:",
                url,
                "",
                "---",
                `If you do not know ${pendingInvitation.invitedByUser.name} <${pendingInvitation.invitedByUser.email}>, please ignore this email.`,
              ].join("\n"),
            });

            await prismaClient.pendingInvitation.delete({
              where: {
                id: pendingInvitation.id,
              },
            });
          } else {
            await emailWorker.sendEmail({
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
          }
        };

        // don't await because of timing issues
        void fn().catch((error) => {
          console.error("Error sending invite or reset password email:", error);
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
