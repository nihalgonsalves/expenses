import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import * as backendUserApi from "@nihalgonsalves/expenses-backend/src/service/user/user-api";

import {
  withRequiredServerContext,
  withServerContext,
} from "../server/context";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () =>
    withRequiredServerContext(async (context) =>
      backendUserApi.getCurrentUser(context),
    ),
);

export const signOut = createServerFn({ method: "POST" }).handler(async () =>
  withServerContext(async (context) => {
    await backendUserApi.signOut(context);
  }),
);

export const anonymizeCurrentUser = createServerFn({ method: "POST" }).handler(
  async () =>
    withRequiredServerContext(async (context) =>
      backendUserApi.anonymizeUser(context),
    ),
);

export const updateCurrentUserTheme = createServerFn({ method: "POST" })
  .validator(ZTheme)
  .handler(async ({ data }) =>
    withRequiredServerContext(async (context) =>
      backendUserApi.updateTheme(context, data),
    ),
  );

const currentUserQueryKey = () => ["user", "me"] as const;

const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: currentUserQueryKey(),
    queryFn: async () => getCurrentUser(),
    staleTime: Infinity,
    // A missing session is the normal logged-out stat
    retry: false,
  });

export const userApi = {
  me: {
    queryKey: currentUserQueryKey,
    queryOptions: currentUserQueryOptions,
  },
  signOut: {
    mutationOptions: () =>
      mutationOptions({
        mutationFn: async () => signOut(),
      }),
  },
  anonymize: {
    mutationOptions: () =>
      mutationOptions({
        mutationFn: async () => {
          const deletedId = await anonymizeCurrentUser();
          return deletedId;
        },
      }),
  },
  theme: {
    mutationOptions: () =>
      mutationOptions({
        mutationFn: async (theme: z.output<typeof ZTheme>) =>
          updateCurrentUserTheme({ data: theme }),
      }),
  },
};

export const useCurrentUser = () => {
  const { user } = useRouteContext({ strict: false });

  return user;
};
