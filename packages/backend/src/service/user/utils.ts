import { Temporal } from '@js-temporal/polyfill';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

import { config } from '../../config';

import { ZJWTToken, type User, type JWTToken } from './types';

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);

const alg = 'HS256';
const secret = new TextEncoder().encode(config.JWT_SECRET);

export const signJWT = async (user: User): Promise<JWTToken> => {
  const token = await new SignJWT({})
    .setSubject(user.email)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(
      Temporal.Now.instant().add({ seconds: config.JWT_EXPIRY_SECONDS })
        .epochSeconds,
    )
    .setIssuer(config.JWT_IDENTITY)
    .setAudience(config.JWT_IDENTITY)
    .sign(secret);

  return ZJWTToken.parse(token);
};

export const verifyJWT = (token: JWTToken) =>
  jwtVerify(token, secret, {
    issuer: config.JWT_IDENTITY,
    audience: config.JWT_IDENTITY,
  });
