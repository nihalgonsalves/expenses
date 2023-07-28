import { faker } from '@faker-js/faker';
import {
  type PrismaClient,
  type Prisma,
  GroupParticipantRole,
} from '@prisma/client';

import { CURRENCY_CODES } from '../src/money';
import { generateId } from '../src/nanoid';
import { type User } from '../src/service/user/types';

import { getUserKeys } from './webPushUtils';

const randomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

export const currencyCodeFactory = () => randomItem(CURRENCY_CODES);

export const userFactory = async (
  prisma: PrismaClient,
  overrides: Partial<Prisma.UserCreateInput> = {},
) =>
  prisma.user.create({
    data: {
      id: generateId(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      ...overrides,
    },
  });

export const groupFactory = async (
  prisma: PrismaClient,
  opts: {
    withOwnerId?: string;
    withParticipantIds?: string[];
    currencyCode?: string;
  } = {},
) => {
  const createOptions = [];

  if (opts.withOwnerId) {
    createOptions.push({
      participantId: opts.withOwnerId,
      role: GroupParticipantRole.ADMIN,
    });
  }

  if (opts.withParticipantIds) {
    createOptions.push(
      ...opts.withParticipantIds.map((participantId) => ({
        participantId: participantId,
        role: GroupParticipantRole.MEMBER,
      })),
    );
  }

  return prisma.group.create({
    data: {
      id: generateId(),
      name: `${faker.location.city()} trip`,
      currencyCode: opts.currencyCode ?? currencyCodeFactory(),
      participants: {
        create: createOptions,
      },
    },
  });
};

export const notificationSubscriptionFactory = async (
  prisma: PrismaClient,
  user: User,
  endpoint?: string,
) => {
  const { auth, p256dh } = getUserKeys();

  return prisma.notificationSubscription.create({
    data: {
      id: generateId(),
      userId: user.id,
      description: 'Test',
      endpoint: endpoint ?? `https://push.example.com/user/${user.id}`,
      keyAuth: auth,
      keyP256dh: p256dh,
    },
  });
};
