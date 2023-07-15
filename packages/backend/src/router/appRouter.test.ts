import { describe, expect, it } from 'vitest';

import { getTRPCCaller } from '../../test/getTRPCCaller';

const { usePublicCaller } = await getTRPCCaller();

describe('router', () => {
  describe('health', () => {
    it('should respond with OK', async () => {
      const caller = usePublicCaller();

      expect(await caller.health()).toEqual({
        status: 'ok',
        message: 'healthy',
      });
    });
  });
});
