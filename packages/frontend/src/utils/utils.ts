import type {
  GroupSheetTransactionListItem,
  TransactionListItem,
} from "@nihalgonsalves/expenses-shared/types/transaction";

import { formatCurrency } from "./money";

const DEFAULT_LOCALE = "en-US";

export const getUserLanguage = () => {
  const locale =
    globalThis.navigator.languages[0] || navigator.language || DEFAULT_LOCALE;

  try {
    // https://github.com/microsoft/playwright/issues/34046
    // https://github.com/adobe/react-spectrum/issues/7457
    Intl.DateTimeFormat.supportedLocalesOf(locale);
    return locale;
  } catch {
    return DEFAULT_LOCALE;
  }
};

export const getInitials = (name: string): string => {
  const [first, last] = name.split(" ");

  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
};

export const getShortName = (name: string): string => name.split(" ")[0] ?? "";

export const getTransactionDescription = ({
  description,
  category,
}: Pick<TransactionListItem, "category" | "description">): string =>
  (description || undefined) ?? category;

export const getGroupSheetTransactionSummaryText = ({
  type,
  participants,
  yourBalance,
}: GroupSheetTransactionListItem): string => {
  if (type === "TRANSFER") {
    const to = participants.find((p) => p.type === "transfer_to");
    const from = participants.find((p) => p.type === "transfer_from");

    return `${getShortName(to?.name ?? "")} paid ${getShortName(
      from?.name ?? "",
    )} ${to?.balance.actual ? formatCurrency(to.balance.actual) : undefined}`;
  }

  if (yourBalance == null) {
    return "Not involved";
  }

  return `Your share: ${formatCurrency(yourBalance.share, {
    signDisplay: "never",
  })}`;
};

export const noop = () => {
  // do nothing
};
