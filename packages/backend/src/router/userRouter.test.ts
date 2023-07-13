import { describe, expect, it } from 'vitest';

import { useTRPCCaller } from '../../test/getTRPCCaller';
import { expectError, expectSuccess } from '../../test/utils';

const caller = await useTRPCCaller();

const createUser = () =>
  caller.user.createUser({
    name: 'Emily',
    email: 'emily@example.com',
    password: 'correct-horse-battery-staple',
  });

describe('createUser', () => {
  it('creates a user', async () => {
    expect(await createUser()).toEqual({
      ok: true,
      value: {
        id: expect.any(String),
        name: 'Emily',
        email: 'emily@example.com',
      },
    });
  });

  it('returns an error if the user already exists', async () => {
    expectSuccess(await createUser());

    const { error } = expectError(await createUser());
    expect(error.code).toBe('UserAlreadyExists');
  });
});
