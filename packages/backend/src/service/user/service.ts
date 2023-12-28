import type { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import type {
  AuthorizeUserInput,
  User,
  CreateUserInput,
  JWTToken,
  UpdateUserInput,
} from '@nihalgonsalves/expenses-shared/types/user';

import { generateId } from '../../utils/nanoid';

import {
  UserServiceError,
  comparePassword,
  hashPassword,
  signJWT,
  verifyJWT,
} from './utils';

export class UserService {
  constructor(
    private prismaClient: Pick<
      PrismaClient,
      '$transaction' | 'user' | 'sheet' | 'category'
    >,
  ) {}

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

      await this.verifyPassword(
        id,
        // don't check against email because this mutation allows changing it too
        undefined,
        input.password,
      );
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

  async anonymizeUser(id: string, input: AuthorizeUserInput): Promise<string> {
    await this.verifyPassword(id, input.email, input.password);

    const [{ id: deletedId }] = await this.prismaClient.$transaction([
      this.prismaClient.user.update({
        where: { id },
        data: {
          name: 'Deleted User',
          email: `deleted_${id}_${generateId()}@example.com`,
          passwordHash: null,
        },
      }),
      // TODO: access via sheetService
      this.prismaClient.sheet.deleteMany({
        where: {
          type: 'PERSONAL',
          participants: { some: { participantId: id, role: 'ADMIN' } },
        },
      }),
    ]);

    return deletedId;
  }

  async getCategories(user: User) {
    return this.prismaClient.category.findMany({
      where: { userId: user.id },
    });
  }

  async setCategoryEmojiShortCode(
    user: User,
    id: string,
    emojiShortCode: string | undefined,
  ) {
    const where = { id_userId: { id, userId: user.id } };

    if (emojiShortCode !== undefined) {
      return this.prismaClient.category.upsert({
        where,
        update: { emojiShortCode },
        create: { id, emojiShortCode, userId: user.id },
      });
    } else {
      await this.prismaClient.category.delete({
        where,
      });
      return undefined;
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

  private async verifyPassword(
    userId: string,
    email: string | undefined,
    password: string,
  ) {
    const user = await this.prismaClient.user.findUnique({
      where: email ? { id: userId, email } : { id: userId },
    });

    if (!user) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }

    if (!user.passwordHash) {
      throw new UserServiceError({
        message: "Can't update or delete with no existing password",
        code: 'BAD_REQUEST',
      });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UserServiceError({
        message: 'Invalid credentials',
        code: 'FORBIDDEN',
      });
    }
  }
}
