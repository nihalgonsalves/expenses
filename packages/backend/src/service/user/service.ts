import type { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { TRPCError } from '@trpc/server';

import { generateId } from '../../utils/nanoid';

import type {
  AuthorizeUserInput,
  User,
  CreateUserInput,
  JWTToken,
  UpdateUserInput,
} from './types';
import { comparePassword, hashPassword, signJWT, verifyJWT } from './utils';

export class UserServiceError extends TRPCError {}

export class UserService {
  constructor(private prismaClient: PrismaClient) {}

  async exchangeToken(
    token: JWTToken,
  ): Promise<{ user: User; newToken: JWTToken | undefined }> {
    const { payload, reissue } = await verifyJWT(token);

    if (!payload.sub) {
      throw new UserServiceError({
        message: 'Invalid token',
        code: 'FORBIDDEN',
      });
    }

    const user = await this.prismaClient.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UserServiceError({
        message: 'Invalid token',
        code: 'FORBIDDEN',
      });
    }

    return {
      user,
      newToken: reissue ? await signJWT(user) : undefined,
    };
  }

  async authorize(
    input: AuthorizeUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    const user = await this.findByEmail(input.email);

    if (!user?.passwordHash) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }

    const passwordMatches = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }

    return {
      user,
      token: await signJWT(user),
    };
  }

  async createUser(
    input: CreateUserInput,
  ): Promise<{ user: User; token: JWTToken }> {
    try {
      const user = await this.prismaClient.user.create({
        data: {
          id: generateId(),
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password),
        },
      });

      return { user, token: await signJWT(user) };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.authorize(input);
      }

      throw new UserServiceError({
        message: 'Error signing up',
        code: 'INTERNAL_SERVER_ERROR',
        cause: error,
      });
    }
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    if (input.newPassword != null) {
      if (input.password == null) {
        throw new UserServiceError({
          message: 'The old password is required to set a new password',
          code: 'BAD_REQUEST',
        });
      }

      const user = await this.prismaClient.user.findUniqueOrThrow({
        where: { id },
      });

      if (!user.passwordHash) {
        throw new UserServiceError({
          message: "Can't update if there's no existing password",
          code: 'BAD_REQUEST',
        });
      }

      const passwordMatches = await comparePassword(
        input.password,
        user.passwordHash,
      );

      if (!passwordMatches) {
        throw new UserServiceError({
          message: 'Invalid credentials',
          code: 'FORBIDDEN',
        });
      }
    }

    return this.prismaClient.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        ...(input.newPassword
          ? { passwordHash: await hashPassword(input.newPassword) }
          : {}),
      },
    });
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
