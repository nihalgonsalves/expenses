import type { Money } from "@nihalgonsalves/expenses-shared/money";

import { formatCurrency } from "../utils/money";

export const CurrencySpan = ({
  money,
  ...options
}: {
  money: Money;
} & Pick<Intl.NumberFormatOptions, "signDisplay" | "currencyDisplay">) => (
  <span className="tabular-nums">{formatCurrency(money, options)}</span>
);
