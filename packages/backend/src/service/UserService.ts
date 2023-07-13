import { type PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import { type ErrorResult, result, type Result } from '../result';

const SALT_ROUNDS = 10;

const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

// const comparePassword = (password: string, hash: string): Promise<boolean> =>
//   bcrypt.compare(password, hash);

type UserServiceError = ErrorResult<'ServerError' | 'UserAlreadyExists'>;

type User = { id: string; name: string; email: string };

export const ZCreateUserInput = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

type CreateUserInput = z.infer<typeof ZCreateUserInput>;

export class UserService {
  constructor(private prismaClient: PrismaClient) {}

  // async authorize() {}

  async createUser(
    data: CreateUserInput,
  ): Promise<Result<User, UserServiceError>> {
    try {
      // destructure to avoid passing on the password
      const { id, name, email } = await this.prismaClient.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: await hashPassword(data.password),
        },
      });

      return result.ok({ id, name, email });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return result.error({
          code: 'UserAlreadyExists',
          message: 'User already exists',
        });
      }

      return result.error({
        code: 'ServerError',
        message: 'Error creating user',
      });
    }
  }
}
