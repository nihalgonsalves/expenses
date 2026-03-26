import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { createPrisma, type PrismaClientType } from "../create-prisma.ts";
import { config, IS_PROD } from "../config.ts";
import type { IEmailWorker } from "../service/email/email-worker.ts";
import { admin, genericOAuth, emailOTP, testUtils } from "better-auth/plugins";
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
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (type === "sign-in") {
            void emailWorker
              .sendEmail({
                to: {
                  name: email,
                  address: email,
                },
                subject: `Your ${config.APP_NAME} verification code: ${otp}`,
                text: [
                  `Enter the code ${otp} to sign in to your account on ${config.PUBLIC_ORIGIN}.`,
                  "---",
                  `If you did not request this link and do not have an account on ${config.APP_NAME}, please ignore this email.`,
                ].join("\n"),
              })
              .catch((err) => {
                console.error(`Error sending OTP email to ${email}:`, err);
              });
          } else if (type === "email-verification") {
            // currently unused
          } else {
            // currently unused
          }
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
