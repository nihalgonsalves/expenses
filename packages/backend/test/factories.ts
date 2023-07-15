import { faker } from '@faker-js/faker';
import { type PrismaClient } from '@prisma/client';

export const userFactory = async (prisma: PrismaClient) =>
  prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
  });
