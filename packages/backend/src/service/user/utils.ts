import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify, errors } from "jose";
import { z } from "zod";

import {
  ZJWTToken,
  type User,
  type JWTToken,
} from "@nihalgonsalves/expenses-shared/types/user";

import { config } from "../../config.ts";

const SALT_ROUNDS = 10;
// https://stackoverflow.com/questions/26739167/jwt-json-web-token-automatic-prolongation-of-expiration
const REISSUE_MIN_AGE_SECS = Temporal.Duration.from({ hours: 1 }).total(
  "seconds",
);

export class UserServiceError extends TRPCError {}

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);

const alg = "HS256";
const secret = new TextEncoder().encode(config.JWT_SECRET);

export const signJWT = async (
  user: Pick<User, "id">,
  {
    identity = config.JWT_IDENTITY,
    payload = {},
    expiry = { seconds: config.JWT_EXPIRY_SECONDS },
  }: {
    identity?: string;
    payload?: Record<string, unknown>;
    expiry?: Omit<Temporal.DurationLike, "years" | "months" | "weeks" | "days">;
  } = {},
): Promise<JWTToken> => {
  const token = await new SignJWT(payload)
    .setSubject(user.id)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(Temporal.Now.instant().add(expiry).epochSeconds)
    .setIssuer(identity)
    .setAudience(identity)
    .sign(secret);

  return ZJWTToken.parse(token);
};

export const verifyJWT = async (
  token: JWTToken,
  identity = config.JWT_IDENTITY,
) => {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: identity,
      audience: identity,
    });

    // we always set an iat
    const issuedAtEpochSeconds = z.number().positive().parse(payload.iat);

    return {
      payload,
      reissue:
        Temporal.Now.instant().epochSeconds - issuedAtEpochSeconds >=
        REISSUE_MIN_AGE_SECS,
    };
  } catch (e) {
    if (e instanceof errors.JOSEError) {
      throw new UserServiceError({
        message: "Invalid token",
        code: "FORBIDDEN",
        cause: e,
      });
    }
    throw e;
  }
};
