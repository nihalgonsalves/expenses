import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from 'testcontainers';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { appRouter } from './router';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let caller: ReturnType<typeof appRouter.createCaller>;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:15.3-alpine')
    .withExposedPorts(5432)
    .start();

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: container.getConnectionUri(),
      },
    },
  });

  caller = appRouter.createCaller({ prisma });
});

afterAll(async () => {
  await prisma.$disconnect();
  await container.stop();
});

describe('router', () => {
  describe('health', () => {
    it('should respond with OK', async () => {
      expect(await caller.health()).toEqual({
        status: 'ok',
        message: 'healthy',
      });
    });
  });

  describe('ping', () => {
    it('should respond with pong', async () => {
      expect(await caller.ping('hello')).toBe('pong: hello');
    });
  });
});
