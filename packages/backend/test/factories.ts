import { faker } from "@faker-js/faker";

import { CURRENCY_CODES } from "@nihalgonsalves/expenses-shared/money";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import type { PrismaClientType } from "../src/create-prisma.ts";
import {
  type Prisma,
  SheetParticipantRole,
  SheetType,
} from "../src/prisma/client.ts";
import { generateId } from "../src/utils/nanoid.ts";

import { getUserKeys } from "./webPushUtils.ts";

const randomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

export const currencyCodeFactory = () => randomItem(CURRENCY_CODES);

export const userFactory = async (
  prisma: PrismaClientType,
  overrides: Partial<Prisma.UserCreateInput> = {},
) =>
  prisma.user.create({
    data: {
      id: generateId(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      ...overrides,
    },
    omit: { passwordHash: false, passwordResetToken: false },
  });

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
