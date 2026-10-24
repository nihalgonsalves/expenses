import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";

import { formatDraftMoney } from "../../utils/money";
import { formatDateTimeRelative } from "../../utils/temporal";

export const DraftAmount = ({ money }: { money: TransactionDraft["money"] }) =>
  money ? (
    <span className="whitespace-nowrap tabular-nums">
      {formatDraftMoney(money)}
    </span>
  ) : (
    "Amount not recognised"
  );

export const DraftSummary = ({ draft }: { draft: TransactionDraft }) => (
  <>
    {draft.description ?? "No description"} ·{" "}
    <DraftAmount money={draft.money} /> ·{" "}
    {formatDateTimeRelative(draft.spentAt)}
  </>
);
