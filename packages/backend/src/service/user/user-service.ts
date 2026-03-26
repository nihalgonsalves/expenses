import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../../create-prisma.ts";
import type { Sheet } from "../../prisma/client.ts";
import { generateId } from "../../utils/nanoid.ts";

import { UserServiceError } from "./utils.ts";
import type { BetterAuthInstance } from "../../utils/auth.ts";
import type { IEmailWorker } from "../email/email-worker.ts";
import { config } from "../../config.ts";

export class UserService {
  private prismaClient: Pick<
    PrismaClientType,
    "$transaction" | "user" | "account" | "sheet" | "category"
  >;
  private betterAuth: BetterAuthInstance;
  private emailWorker: IEmailWorker;

  constructor(
    prismaClient: UserService["prismaClient"],
    betterAuth: UserService["betterAuth"],
    emailWorker: IEmailWorker,
  ) {
    this.prismaClient = prismaClient;
    this.betterAuth = betterAuth;
    this.emailWorker = emailWorker;
  }

  async inviteUser(input: {
    invitedUserName: string;
    invitedUserEmail: string;
    groupSheet: Pick<Sheet, "id" | "name">;
    invitedBy: User;
  }) {
    const { user } = await this.betterAuth.api.createUser({
      body: {
        name: input.invitedUserName,
        email: input.invitedUserEmail,
      },
    });

    const url = new URL(`/auth/sign-in`, config.PUBLIC_ORIGIN);
    url.searchParams.set("redirect", `/groups/${input.groupSheet.id}`);

    await this.emailWorker.sendEmail({
      to: {
        name: input.invitedUserName,
        address: input.invitedUserEmail,
      },
      subject: `Share expenses for "${input.groupSheet.name}" with ${input.invitedBy.name}`,
      text: [
        `You've been invited by ${input.invitedBy.name} to join the "${input.groupSheet.name}" sheet on ${config.APP_NAME}.`,
        "",
        `To get started, click the link below and sign-in with your email address ${input.invitedUserEmail}:`,
        url.toString(),
        "",
        "---",
        `If you do not know ${input.invitedBy.name} <${input.invitedBy.email}>, please ignore this email.`,
      ].join("\n"),
    });

    return user;
  }

  async updateTheme(id: string, theme: string) {
    return this.prismaClient.user.update({
      where: { id },
      data: {
        theme,
      },
    });
  }

  async anonymizeUser(id: string, headers: Headers): Promise<string> {
    await this.betterAuth.api.revokeSessions({ headers });

    const [{ id: deletedId }] = await this.prismaClient.$transaction([
      this.prismaClient.user.update({
        where: { id },
        data: {
          name: "Deleted User",
          email: `deleted_${id}_${generateId()}@example.com`,
        },
      }),
      this.prismaClient.account.deleteMany({
        where: { userId: id },
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

  async findByEmail(email: string) {
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
}
