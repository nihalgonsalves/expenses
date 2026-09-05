import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ZCreateCategoryGroupInput,
  ZUpdateCategoryGroupInput,
} from "@nihalgonsalves/expenses-shared/types/category-group";
import { ZTheme } from "@nihalgonsalves/expenses-shared/types/theme";
import * as backendUserApi from "@nihalgonsalves/expenses-backend/src/service/user/user-api.server";

import {
  requiredServerContextMiddleware,
  serverContextMiddleware,
} from "../server/context.functions";

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) => backendUserApi.getCurrentUser(context));

export const signOut = createServerFn({ method: "POST" })
  .middleware([serverContextMiddleware])
  .handler(async ({ context }) => backendUserApi.signOut(context));

export const anonymizeCurrentUser = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) => backendUserApi.anonymizeUser(context));

export const updateCurrentUserTheme = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(ZTheme)
  .handler(async ({ context, data }) =>
    backendUserApi.updateTheme(context, data),
  );

export const getCategoryGroups = createServerFn({ method: "GET" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) => backendUserApi.getCategoryGroups(context));

export const createCategoryGroup = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(ZCreateCategoryGroupInput)
  .handler(async ({ context, data }) =>
    backendUserApi.createCategoryGroup(context, data),
  );

export const updateCategoryGroup = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(ZUpdateCategoryGroupInput)
  .handler(async ({ context, data }) =>
    backendUserApi.updateCategoryGroup(context, data),
  );

export const deleteCategoryGroup = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    backendUserApi.deleteCategoryGroup(context, data),
  );

const currentUserQueryKey = () => ["user", "me"] as const;
const categoryGroupsQueryKey = () => ["category-groups"] as const;

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
  categoryGroups: {
    queryKey: categoryGroupsQueryKey,
    queryOptions: () =>
      queryOptions({
        queryKey: categoryGroupsQueryKey(),
        queryFn: getCategoryGroups,
        staleTime: Infinity,
      }),
    createMutationOptions: () =>
      mutationOptions({
        mutationFn: async (data: z.input<typeof ZCreateCategoryGroupInput>) =>
          createCategoryGroup({ data }),
      }),
    updateMutationOptions: () =>
      mutationOptions({
        mutationFn: async (data: z.input<typeof ZUpdateCategoryGroupInput>) =>
          updateCategoryGroup({ data }),
      }),
    deleteMutationOptions: () =>
      mutationOptions({
        mutationFn: async (id: string) => deleteCategoryGroup({ data: id }),
      }),
  },
};

export const useCurrentUser = () => {
  const { user } = useRouteContext({ strict: false });

  return user;
};
