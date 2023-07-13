import { expect } from 'vitest';

import { type Result } from '../src/result';

export const expectSuccess = <TValue>(
  result: Result<TValue, unknown>,
): { ok: true; value: TValue } => {
  expect(result).toEqual({
    ok: true,
    value: expect.anything(),
  });

  if (!result.ok) {
    throw new Error('<for typescript>');
  }
  return result;
};

export const expectError = <TError>(
  result: Result<unknown, TError>,
): { ok: false; error: TError } => {
  expect(result).toEqual({
    ok: false,
    error: expect.anything(),
  });

  if (result.ok) {
    throw new Error('<for typescript>');
  }
  return result;
};
