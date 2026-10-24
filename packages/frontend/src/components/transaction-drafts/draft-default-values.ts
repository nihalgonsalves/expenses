import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { CURRENCY_CODES, toMinorUnits } from "../../utils/money";
import { isoToDateTimeInput, nowForDateTimeInput } from "../../utils/temporal";

/** negative amounts are refunds, e.g. "-€5.00" */
export const getDraftTransactionType = (draft: TransactionDraft | undefined) =>
  draft?.money && draft.money.amount < 0 ? "INCOME" : "EXPENSE";

export const getDraftDefaultValues = (
  draft: TransactionDraft | undefined,
  fallbackCurrencyCode: string,
) => {
  const draftCurrencyCode = draft?.money?.currencyCode;
  // the parsed currency may not be one we can handle, e.g. one missing from
  // `Intl` in this browser
  const currencyCode =
    draftCurrencyCode && CURRENCY_CODES.includes(draftCurrencyCode)
      ? draftCurrencyCode
      : fallbackCurrencyCode;

  return {
    currencyCode,
    amount: draft?.money
      ? Math.abs(toMinorUnits(draft.money, currencyCode))
      : 0,
    description: draft?.description ?? "",
    dateTime: draft ? isoToDateTimeInput(draft.spentAt) : nowForDateTimeInput(),
  };
};
