import { type PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import {
  type AuthorizeUserInput,
  type User,
  safeExactUser,
  type CreateUserInput,
  type JWTToken,
} from './types';
import { comparePassword, hashPassword, signJWT, verifyJWT } from './utils';

class UserServiceError extends TRPCError {}

export class UserService {
  constructor(private prismaClient: PrismaClient) {}

  async exchangeToken(token: JWTToken): Promise<User> {
    const decoded = await verifyJWT(token);

    if (!decoded.payload.sub) {
      throw new UserServiceError({
        message: 'Invalid token',
        code: 'FORBIDDEN',
      });
    }

    const user = await this.findByEmail(decoded.payload.sub);

    if (!user) {
      throw new UserServiceError({
        message: 'Invalid token',
        code: 'FORBIDDEN',
      });
    }

    return user;
  }

  async authorize(
    data: AuthorizeUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    const user = await this.findByEmail(data.email);

    if (!user?.passwordHash) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }

    const passwordMatches = await comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }

    return {
      user: safeExactUser(user),
      token: await signJWT(user),
    };
  }

  async createUser(
    data: CreateUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    try {
      const user = await this.prismaClient.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: await hashPassword(data.password),
        },
      });

      return { user: safeExactUser(user), token: await signJWT(user) };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.authorize(data);
      }

      throw new UserServiceError({
        message: 'Error signing up',
        code: 'INTERNAL_SERVER_ERROR',
        cause: error,
      });
    }
  }

  private async findByEmail(email: string) {
    try {
      return await this.prismaClient.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new UserServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        cause: error,
      });
    }
  }
}
