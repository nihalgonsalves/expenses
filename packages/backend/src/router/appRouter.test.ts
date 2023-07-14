import { describe, expect, it } from 'vitest';

import { getTRPCCaller } from '../../test/getTRPCCaller';

const useTRPCCaller = await getTRPCCaller();

describe('router', () => {
  describe('health', () => {
    it('should respond with OK', async () => {
      const caller = useTRPCCaller();

      expect(await caller.health()).toEqual({
        status: 'ok',
        message: 'healthy',
      });
    });
  });
});
