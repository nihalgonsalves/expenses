import { type CreateTRPCReact, createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@nihalgonsalves/expenses-backend";

export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();
