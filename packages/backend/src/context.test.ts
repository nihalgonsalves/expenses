import cookie from 'cookie';
import { vi, describe, it, expect } from 'vitest';

import { AUTH_COOKIE_NAME, getMaybeUser } from './context';
import { UserServiceError } from './service/user/utils';

describe('getMaybeUser', () => {
  it('exchanges a cookie header token for a user', async () => {
    const setJwtToken = vi.fn<[string | null], undefined>();

    const result = await getMaybeUser(
      cookie.serialize(AUTH_COOKIE_NAME, '<jwt-token>'),
      setJwtToken,
      {
        // eslint-disable-next-line @typescript-eslint/require-await
        exchangeToken: async (token) => ({
          user: {
            id: 'id',
            name: `name (${token})`,
            email: 'email',
          },
          newToken: undefined,
        }),
      },
    );

    expect(result).toEqual({
      id: 'id',
      name: 'name (<jwt-token>)',
      email: 'email',
    });
  });

  it('clears token on auth error', async () => {
    const setJwtToken = vi.fn<[string | null], undefined>();

    await expect(
      getMaybeUser(
        cookie.serialize(AUTH_COOKIE_NAME, '<jwt-token>'),
        setJwtToken,
        {
          exchangeToken: async () =>
            Promise.reject(
              new UserServiceError({
                code: 'FORBIDDEN',
              }),
            ),
        },
      ),
    ).rejects.toThrowError('FORBIDDEN');

    expect(setJwtToken).toHaveBeenCalledWith(null);
  });

  it('rethrows without clearing token on generic error', async () => {
    const setJwtToken = vi.fn<[string | null], undefined>();

    await expect(
      getMaybeUser(
        cookie.serialize(AUTH_COOKIE_NAME, '<jwt-token>'),
        setJwtToken,
        {
          exchangeToken: async () => Promise.reject(new Error('Error')),
        },
      ),
    ).rejects.toThrowError('Error');

    expect(setJwtToken).not.toHaveBeenCalled();
  });

  it('sets a reissued token', async () => {
    const setJwtToken = vi.fn<[string | null], undefined>();

    await getMaybeUser(
      cookie.serialize(AUTH_COOKIE_NAME, '<jwt-token>'),
      setJwtToken,
      {
        exchangeToken: async (token) =>
          // @ts-expect-error mock
          Promise.resolve({
            user: {
              id: 'id',
              name: `name (${token})`,
              email: 'email',
            },
            newToken: '<new-jwt-token>',
          }),
      },
    );

    expect(setJwtToken).toHaveBeenCalledWith('<new-jwt-token>');
  });
});
