import {
  type CreateAppleWalletDraftInput,
  type DeleteTransactionDraftInput,
  ZTransactionDraft,
} from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import type { ContextObj } from "../../context.ts";
import type { TransactionDraft } from "../../prisma/client.ts";

import { toDraftMoney } from "./draft-mappers.ts";

type AuthenticatedContext = Pick<ContextObj, "transactionDraftService"> & {
  user: NonNullable<ContextObj["user"]>;
};

const mapDraft = ({
  amount,
  scale,
  currencyCode,
  spentAt,
  ...draft
}: TransactionDraft) =>
  ZTransactionDraft.parse({
    ...draft,
    money: toDraftMoney({ amount, scale, currencyCode }),
    spentAt: spentAt.toISOString(),
  });

export const createAppleWalletDraft = async (
  ctx: AuthenticatedContext,
  input: CreateAppleWalletDraftInput,
) =>
  mapDraft(
    await ctx.transactionDraftService.createFromAppleWallet(
      ctx.user,
      input,
      new Date(),
    ),
  );

export const getTransactionDrafts = async (ctx: AuthenticatedContext) =>
  (await ctx.transactionDraftService.getDrafts(ctx.user)).map(mapDraft);

export const deleteTransactionDraft = async (
  ctx: AuthenticatedContext,
  input: DeleteTransactionDraftInput,
) => {
  await ctx.transactionDraftService.deleteDraft(ctx.user, input.id);
};
