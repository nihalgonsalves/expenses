import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { toMinorUnits } from "../../utils/money";
import { isoToDateTimeInput, nowForDateTimeInput } from "../../utils/temporal";

/** negative amounts are refunds, e.g. "-€5.00" */
export const getDraftTransactionType = (draft: TransactionDraft | undefined) =>
  draft?.money && draft.money.amount < 0 ? "INCOME" : "EXPENSE";

export const getDraftDefaultValues = (
  draft: TransactionDraft | undefined,
  fallbackCurrencyCode: string,
) => {
  const currencyCode = draft?.money?.currencyCode ?? fallbackCurrencyCode;

  return {
    currencyCode,
    amount: draft?.money
      ? Math.abs(toMinorUnits(draft.money, currencyCode))
      : 0,
    description: draft?.description ?? "",
    dateTime: draft ? isoToDateTimeInput(draft.spentAt) : nowForDateTimeInput(),
  };
};
