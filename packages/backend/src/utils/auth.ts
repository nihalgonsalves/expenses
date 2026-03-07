import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { createPrisma, type PrismaClientType } from "../create-prisma.ts";
import { config } from "../config.ts";
import { comparePassword } from "../service/user/utils.ts";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createAuthMiddleware } from "better-auth/api";
import { z } from "zod";
import type { IEmailWorker } from "../service/email/EmailWorker.ts";
import { admin } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

// HACK: fix for this error on the frontend:
//  The inferred type of 'useTRPC' cannot be named without a reference to
//  '../../../../node_modules/@trpc/server/dist/unstable-core-do-not-import.d-BJCeJk5P.cjs'.
//  This is likely not portable. A type annotation is necessary.
// Note that this seems to be fixed in tsgo, it could be unnecessary when TypeScript v7 is out.
export type * from "@simplewebauthn/server";

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
      password: {
        verify: async ({ password, hash }) => {
          try {
            if (await verifyPassword({ password, hash })) {
              return true;
            }
          } catch {
            // invalid hash, try old bcrypt hash
            if (await comparePassword(password, hash)) {
              return true;
            }
          }

          return false;
        },
      },
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
      database: {
        generateId: false,
      },
    },
    plugins: [admin(), passkey()],
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-in/email" || !ctx.context.session) {
          return;
        }

        const { email, password } = z
          .object({ email: z.email(), password: z.string() })
          .parse(ctx.body);

        if (email !== ctx.context.session.user.email) {
          // should not be possible, we just signed in with this email
          throw new Error();
        }

        const user = await prismaClient.user.findUniqueOrThrow({
          where: { email: ctx.context.session.user.email },
          include: { accounts: { where: { providerId: "credential" } } },
        });

        const account = user.accounts.at(0);
        if (!account) {
          // should not be possible, we just signed in with one
          throw new Error();
        }

        if (!account.password?.startsWith("$2b$")) {
          // already in the new format
          return;
        }

        // update hash
        await prismaClient.account.update({
          where: { id: account.id },
          data: {
            password: await hashPassword(password),
          },
        });
      }),
    },
  });

/** @lintignore for the CLI - should not be used in the app */
export const auth: unknown = config.BETTER_AUTH_CLI
  ? createAuth(createPrisma(), { sendEmail: async () => Promise.resolve() })
  : undefined;

export type BetterAuthInstance = ReturnType<typeof createAuth>;
