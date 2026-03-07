import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";

export class UserServiceError extends TRPCError {}

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);
