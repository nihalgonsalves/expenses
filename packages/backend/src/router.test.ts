import { describe, expect, it } from 'vitest';

import { appRouter } from './router';

describe('router', () => {
  describe('ping', () => {
    it('should respond with pong', async () => {
      expect(await appRouter.createCaller({}).ping('hello')).toBe(
        'pong: hello',
      );
    });
  });
});
