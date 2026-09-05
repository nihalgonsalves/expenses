import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ZNotificationSubscriptionUpsertInput } from "@nihalgonsalves/expenses-shared/types/notification";
import * as backendNotificationApi from "@nihalgonsalves/expenses-backend/src/service/notification/notification-api.server";

import { requiredServerContextMiddleware } from "../server/context.functions";

export const getPublicKey = createServerFn({ method: "GET" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) => backendNotificationApi.getPublicKey(context));

export const upsertSubscription = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(ZNotificationSubscriptionUpsertInput)
  .handler(async ({ context, data }) =>
    backendNotificationApi.upsertSubscription(context, data),
  );

export const deleteSubscription = createServerFn({ method: "POST" })
  .middleware([requiredServerContextMiddleware])
  .validator(z.string())
  .handler(async ({ context, data }) =>
    backendNotificationApi.deleteSubscription(context, data),
  );

export const getSubscriptions = createServerFn({ method: "GET" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) =>
    backendNotificationApi.getSubscriptions(context),
  );

const notificationQueryKeyPrefix = ["notification"] as const;
const publicKeyQueryKey = () =>
  [...notificationQueryKeyPrefix, "public-key"] as const;
const subscriptionsQueryKey = () =>
  [...notificationQueryKeyPrefix, "subscriptions"] as const;

const publicKeyQueryOptions = () =>
  queryOptions({
    queryKey: publicKeyQueryKey(),
    queryFn: async () => getPublicKey(),
    staleTime: Infinity,
  });

const subscriptionsQueryOptions = () =>
  queryOptions({
    queryKey: subscriptionsQueryKey(),
    queryFn: async () => getSubscriptions(),
    staleTime: Infinity,
  });

export const notificationQueries = {
  publicKey: {
    queryKey: publicKeyQueryKey,
    queryOptions: publicKeyQueryOptions,
  },
  subscriptions: {
    queryKey: subscriptionsQueryKey,
    queryOptions: subscriptionsQueryOptions,
  },
};

export const notificationMutations = {
  upsertSubscription: () =>
    mutationOptions({
      mutationFn: async (
        data: z.output<typeof ZNotificationSubscriptionUpsertInput>,
      ) => upsertSubscription({ data }),
    }),
  deleteSubscription: () =>
    mutationOptions({
      mutationFn: async (id: string) => deleteSubscription({ data: id }),
    }),
};
