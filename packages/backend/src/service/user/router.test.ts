import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';

import { personalSheetFactory, userFactory } from '../../../test/factories';
import { getTRPCCaller } from '../../../test/getTRPCCaller';
import { createPersonalSheetTransactionInput } from '../../../test/input';

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
    ).rejects.toThrow("Can't update or delete with no existing password");
  });
});

describe('authorizeUser', () => {
  it('returns a user and logs in', async () => {
    const setJWTToken = vi.fn();
    const caller = usePublicCaller(setJWTToken);

    await caller.user.createUser(userArgs);
    expect(setJWTToken.mock.calls).toMatchObject([[expect.any(String)]]);
    setJWTToken.mockReset();

    expect(await caller.user.authorizeUser(userArgs)).toEqual({
      id: expect.any(String),
      name: 'Emily',
      email: 'emily@example.com',
    });
    expect(setJWTToken.mock.calls).toEqual([[expect.any(String)]]);
  });

  it('returns an error if the password is wrong', async () => {
    const user = await userFactory(prisma);
    const caller = usePublicCaller();

    await expect(
      caller.user.authorizeUser({
        email: user.email,
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
    const setJWTToken = vi.fn();
    const caller = usePublicCaller(setJWTToken);

    await caller.user.signOut();
    expect(setJWTToken.mock.calls).toEqual([[null]]);
  });
});

describe('anonymizeUser', () => {
  it('anonymizes a user', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('password'),
    });
    const caller = useProtectedCaller(user);

    const deletedUserId = await caller.user.anonymizeUser({
      email: user.email,
      password: 'password',
    });

    expect(deletedUserId).toBe(user.id);

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deletedUser).toMatchObject({
      id: user.id,
      name: 'Deleted User',
      passwordHash: null,
    });

    expect(
      /deleted_[\w]+_[\w]+@example.com/.test(deletedUser?.email ?? ''),
    ).toBe(true);
  });

  it('resets the JWT token', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('password'),
    });

    const setJWTToken = vi.fn();
    const caller = useProtectedCaller(user, setJWTToken);

    await caller.user.anonymizeUser({
      email: user.email,
      password: 'password',
    });

    expect(setJWTToken.mock.calls).toEqual([[null]]);
  });
  it('deletes personal sheets and expenses', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('password'),
    });

    const personalSheet = await personalSheetFactory(prisma, {
      withOwnerId: user.id,
    });

    const caller = useProtectedCaller(user);

    const expense = await caller.expense.createPersonalSheetTransaction(
      createPersonalSheetTransactionInput(
        personalSheet.id,
        personalSheet.currencyCode,
        'EXPENSE',
      ),
    );

    await caller.user.anonymizeUser({
      email: user.email,
      password: 'password',
    });

    expect(
      await prisma.sheet.findFirst({
        where: { id: personalSheet.id },
      }),
    ).toBeNull();

    expect(
      await prisma.transaction.findFirst({ where: { id: expense.id } }),
    ).toBeNull();
  });

  it("returns 403 if the details don't match the logged-in user", async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('password'),
    });
    const caller = useProtectedCaller(user);

    await expect(
      caller.user.anonymizeUser({
        email: faker.internet.email(),
        password: 'password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('returns 403 if the password is wrong', async () => {
    const user = await userFactory(prisma, {
      passwordHash: await hashPassword('password'),
    });
    const caller = useProtectedCaller(user);

    await expect(
      caller.user.anonymizeUser({
        email: user.email,
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
