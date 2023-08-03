import { describe, expect, it } from 'vitest';

import { userFactory } from '../../../test/factories';
import { getTRPCCaller } from '../../../test/getTRPCCaller';

import type { JWTToken } from './types';
import { comparePassword, hashPassword } from './utils';

const userArgs = {
  name: 'Emily',
  email: 'emily@example.com',
  password: 'correct-horse-battery-staple',
};

const { usePublicCaller, useProtectedCaller, prisma } = await getTRPCCaller();

describe('createUser', () => {
  it('creates a user ', async () => {
    const caller = usePublicCaller();

    expect(await caller.user.createUser(userArgs)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
  });

  it('logs in if the user already exists and the password matches', async () => {
    const caller = usePublicCaller();

    await caller.user.createUser(userArgs);
    expect(await caller.user.createUser(userArgs)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
  });

  it('returns an error if the user already exists', async () => {
    const caller = usePublicCaller();

    await caller.user.createUser({ ...userArgs, password: 'aaa' });
    await expect(caller.user.createUser(userArgs)).rejects.toThrow(
      'Invalid credentials',
    );
  });
});

describe('updateUser', () => {
  it('updates a user', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    const updatedUser = await caller.user.updateUser({
      name: 'Juan',
      email: 'juan@example.com',
    });

    expect(updatedUser).toMatchObject({
      id: user.id,
      name: 'Juan',
      email: 'juan@example.com',
    });
  });

  it("updates a user's password", async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('old-password'),
    });
    const caller = useProtectedCaller(user);

    await caller.user.updateUser({
      name: 'Juan',
      email: 'juan@example.com',
      password: 'old-password',
      newPassword: 'new-password',
    });

    const { passwordHash: newHash } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    expect(await comparePassword('new-password', newHash!)).toBe(true);
  });

  it('returns 401 if the old password is wrong', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('old-password'),
    });
    const caller = useProtectedCaller(user);

    await expect(
      caller.user.updateUser({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'not-the-old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('returns 401 if the old password is not provided', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('old-password'),
    });
    const caller = useProtectedCaller(user);

    await expect(
      caller.user.updateUser({
        name: 'Juan',
        email: 'juan@example.com',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow('The old password is required to set a new password');
  });

  it('returns 400 if there is no existing db password', async () => {
    const user = await userFactory(prisma);
    const caller = useProtectedCaller(user);

    await expect(
      caller.user.updateUser({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow("Can't update if there's no existing password");
  });
});

describe('authorizeUser', () => {
  it('returns a user and logs in', async () => {
    let token: JWTToken | null | undefined;
    const caller = usePublicCaller((t) => {
      token = t;
    });

    await caller.user.createUser(userArgs);
    expect(token).toBeDefined();
    token = undefined;

    expect(await caller.user.authorizeUser(userArgs)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
    expect(token).toBeDefined();
  });

  it('returns an error if the password is wrong', async () => {
    const caller = usePublicCaller();

    await expect(
      caller.user.authorizeUser({
        email: userArgs.email,
        password: 'wrong-horse-battery-staple',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it("returns an error if the user doesn't exist", async () => {
    const caller = usePublicCaller();

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
    const caller = usePublicCaller((t) => {
      token = t;
    });

    expect(token).toBeUndefined();
    await caller.user.signOut();
    expect(token).toBeNull();
  });
});
