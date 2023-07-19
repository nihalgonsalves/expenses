import { faker } from '@faker-js/faker';
import {
  type PrismaClient,
  type Prisma,
  GroupParticipantRole,
} from '@prisma/client';

import { CURRENCY_CODES } from '../src';
import { generateId } from '../src/nanoid';

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
