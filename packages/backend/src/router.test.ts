import { PrismaClient } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { appRouter } from './router';

let prisma: PrismaClient;
let caller: ReturnType<typeof appRouter.createCaller>;

beforeAll(() => {
  prisma = new PrismaClient();
  caller = appRouter.createCaller({ prisma });
});

afterAll(async () => {
  await prisma.$disconnect();
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
