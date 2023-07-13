import { describe, expect, it } from 'vitest';

import { useTRPCCaller } from '../../test/getTRPCCaller';

const caller = await useTRPCCaller();

describe('router', () => {
  describe('health', () => {
    it('should respond with OK', async () => {
      expect(await caller.health()).toEqual({
        status: 'ok',
        message: 'healthy',
      });
    });
  });
});
