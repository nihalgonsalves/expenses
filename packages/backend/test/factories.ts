import { faker } from '@faker-js/faker';
import { type PrismaClient, GroupParticipantRole } from '@prisma/client';

export const userFactory = async (prisma: PrismaClient) =>
  prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
  });

export const groupFactory = async (
  prisma: PrismaClient,
  opts: { withOwnerId?: string; withParticipantIds?: string[] } = {},
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
      name: `${faker.location.city()} trip`,
      defaultCurrency: faker.finance.currencyCode(),
      participants: {
        create: createOptions,
      },
    },
  });
};

export const expenseFactory = async (
  prisma: PrismaClient,
  group: Awaited<ReturnType<typeof groupFactory>>,
  paidById: string,
) => {
  const amount = faker.number.int(100_00);

  return prisma.expense.create({
    data: {
      currency: group.defaultCurrency,
      amount,
      scale: 2,
      description: '',
      spentAt: new Date(),
      groupId: group.id,
      transactions: {
        create: [
          { userId: paidById, amount: -amount, scale: 2 },
          { userId: paidById, amount: +amount, scale: 2 },
        ],
      },
    },
  });
};
