import { faker } from "@faker-js/faker";

import { CURRENCY_CODES } from "@nihalgonsalves/expenses-shared/money";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../src/create-prisma.ts";
import { SheetParticipantRole, SheetType } from "../src/prisma/client.ts";
import { generateId } from "../src/utils/nanoid.ts";

import { getUserKeys } from "./web-push-utils.ts";
import type { BetterAuthInstance } from "../src/utils/auth.ts";

const randomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

export const currencyCodeFactory = () => randomItem(CURRENCY_CODES);

export const userFactory = async (
  prisma: PrismaClientType,
  betterAuth: BetterAuthInstance,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) => {
  const {
    response: { user: betterAuthUser },
    headers,
  } = await betterAuth.api.signUpEmail({
    body: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...overrides,
    },
    returnHeaders: true,
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: betterAuthUser.id },
  });

  const cookieHeader = headers.getSetCookie().at(0)?.split(";").at(0);
  if (!cookieHeader) {
    throw new Error("No Set-Cookie header found in signUpEmail response");
  }

  return { user, cookieHeader };
};

export const groupSheetFactory = async (
  prisma: PrismaClientType,
  opts: {
    withOwnerId?: string;
    withParticipantIds?: string[];
    currencyCode?: string;
    isArchived?: boolean;
  } = {},
) => {
  const createOptions = [];

  if (opts.withOwnerId) {
    createOptions.push({
      participantId: opts.withOwnerId,
      role: SheetParticipantRole.ADMIN,
    });
  }

  if (opts.withParticipantIds) {
    createOptions.push(
      ...opts.withParticipantIds.map((participantId) => ({
        participantId,
        role: SheetParticipantRole.MEMBER,
      })),
    );
  }

  return prisma.sheet.create({
    data: {
      id: generateId(),
      type: SheetType.GROUP,
      name: `${faker.location.city()} trip`,
      currencyCode: opts.currencyCode ?? currencyCodeFactory(),
      isArchived: opts.isArchived ?? false,
      participants: {
        create: createOptions,
      },
    },
  });
};

export const personalSheetFactory = async (
  prisma: PrismaClientType,
  opts: {
    withOwnerId?: string;
    currencyCode?: string;
    isArchived?: boolean;
  } = {},
) => {
  const createOptions = [];

  if (opts.withOwnerId) {
    createOptions.push({
      participantId: opts.withOwnerId,
      role: SheetParticipantRole.ADMIN,
    });
  }

  return prisma.sheet.create({
    data: {
      id: generateId(),
      type: SheetType.PERSONAL,
      name: "Personal expenses",
      currencyCode: opts.currencyCode ?? currencyCodeFactory(),
      isArchived: opts.isArchived ?? false,
      participants: {
        create: createOptions,
      },
    },
  });
};

export const notificationSubscriptionFactory = async (
  prisma: PrismaClientType,
  user: User,
  endpoint?: string,
) => {
  const { auth, p256dh } = getUserKeys();

  return prisma.notificationSubscription.create({
    data: {
      id: generateId(),
      userId: user.id,
      description: "Test",
      endpoint: endpoint ?? `https://push.example.com/user/${user.id}`,
      keyAuth: auth,
      keyP256dh: p256dh,
    },
  });
};
