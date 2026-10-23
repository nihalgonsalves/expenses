import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import * as backendTransactionDraftApi from "@nihalgonsalves/expenses-backend/src/service/transaction-draft/transaction-draft-api.server";

import { requiredServerContextMiddleware } from "../server/context.functions";

import { useCurrentUser } from "./user.functions";

export const getTransactionDrafts = createServerFn({ method: "GET" })
  .middleware([requiredServerContextMiddleware])
  .handler(async ({ context }) =>
    backendTransactionDraftApi.getTransactionDrafts(context),
  );

const transactionDraftQueryKeyPrefix = ["transaction-draft"] as const;
const draftsQueryKey = () =>
  [...transactionDraftQueryKeyPrefix, "drafts"] as const;

const draftsQueryOptions = () =>
  queryOptions({
    queryKey: draftsQueryKey(),
    queryFn: async () => getTransactionDrafts(),
  });

export const transactionDraftQueries = {
  drafts: {
    queryKey: draftsQueryKey,
    queryOptions: draftsQueryOptions,
  },
};

export const useHasTransactionDrafts = () => {
  const user = useCurrentUser();
  const { data } = useQuery({
    ...draftsQueryOptions(),
    enabled: user != null,
  });

  return (data?.length ?? 0) > 0;
};
