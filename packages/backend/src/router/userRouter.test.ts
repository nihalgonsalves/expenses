import { describe, expect, it } from 'vitest';

import { getTRPCCaller } from '../../test/getTRPCCaller';
import { type JWTToken } from '../service/user/types';

const user = {
  name: 'Emily',
  email: 'emily@example.com',
  password: 'correct-horse-battery-staple',
};

const useTRPCCaller = await getTRPCCaller();

describe('createUser', () => {
  it('creates a user ', async () => {
    const caller = useTRPCCaller();

    expect(await caller.user.createUser(user)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
  });

  it('logs in if the user already exists and the password matches', async () => {
    const caller = useTRPCCaller();

    await caller.user.createUser(user);
    expect(await caller.user.createUser(user)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
  });

  it('returns an error if the user already exists', async () => {
    const caller = useTRPCCaller();

    await caller.user.createUser({ ...user, password: 'aaa' });
    await expect(caller.user.createUser(user)).rejects.toThrow(
      'Invalid credentials',
    );
  });
});

describe('authorizeUser', () => {
  it('returns a user and logs in', async () => {
    let token: JWTToken | null | undefined;
    const caller = useTRPCCaller(undefined, (t) => {
      token = t;
    });

    await caller.user.createUser(user);
    expect(token).toBeDefined();
    token = undefined;

    expect(await caller.user.authorizeUser(user)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
    expect(token).toBeDefined();
  });

  it('returns an error if the password is wrong', async () => {
    const caller = useTRPCCaller();

    await expect(
      caller.user.authorizeUser({
        email: user.email,
        password: 'wrong-horse-battery-staple',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it("returns an error if the user doesn't exist", async () => {
    const caller = useTRPCCaller();

    await expect(
      caller.user.authorizeUser({
        email: 'nobody@example.com',
        password: 'aaa',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});

describe('signOut', () => {
  it('signs a user out', async () => {
    let token: JWTToken | null | undefined;
    const caller = useTRPCCaller(undefined, (t) => {
      token = t;
    });

    expect(token).toBeUndefined();
    expect(await caller.user.signOut()).toEqual(undefined);
    expect(token).toBeNull();
  });
});
