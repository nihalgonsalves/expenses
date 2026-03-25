import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { createPrisma, type PrismaClientType } from "../create-prisma.ts";
import { config, IS_PROD } from "../config.ts";
import type { IEmailWorker } from "../service/email/email-worker.ts";
import { admin, genericOAuth, magicLink, testUtils } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

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
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const fn = async () => {
            const pendingInvitation =
              await prismaClient.pendingInvitation.findFirst({
                where: {
                  invitedUser: {
                    email,
                  },
                },
                include: {
                  invitedUser: true,
                  invitedToSheet: true,
                  invitedByUser: true,
                },
              });

            if (pendingInvitation) {
              await emailWorker.sendEmail({
                to: {
                  name: pendingInvitation.invitedUser.name,
                  address: pendingInvitation.invitedUser.email,
                },
                subject: `Share expenses for "${pendingInvitation.invitedToSheet.name}" with ${pendingInvitation.invitedByUser.name}`,
                text: [
                  `You've been invited by ${pendingInvitation.invitedByUser.name} to join the "${pendingInvitation.invitedToSheet.name}" sheet on ${config.APP_NAME}.`,
                  "",
                  "Click here to sign in:",
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
                  name: email,
                  address: email,
                },
                subject: `Your sign in link for ${config.APP_NAME}`,
                text: [
                  "Click here to sign in:",
                  url,
                  "",
                  "---",
                  `If you did not request this link and do not have an account on ${config.APP_NAME}, please ignore this email.`,
                ].join("\n"),
              });
            }
          };

          // don't await because of timing issues
          void fn().catch((error) => {
            console.error("Error sending invite or magic link email:", error);
          });
        },
      }),
      passkey(),
      genericOAuth({ config: config.OAUTH_PROVIDER_CONFIG }),
      ...((config.VITEST_WORKER_ID || config.VITE_INTEGRATION_TEST) && !IS_PROD
        ? // causes various issues with exact optional property types
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          ([testUtils()] as unknown as BetterAuthPlugin[])
        : []),
    ],
  });

/** @lintignore for the CLI - should not be used in the app */
export const auth: unknown = config.BETTER_AUTH_CLI
  ? createAuth(createPrisma(), { sendEmail: async () => Promise.resolve() })
  : undefined;

export type BetterAuthInstance = ReturnType<typeof createAuth>;
