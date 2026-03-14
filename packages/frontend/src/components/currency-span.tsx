import type { Money } from "@nihalgonsalves/expenses-shared/money";

import { formatCurrency } from "../utils/money";

import { cn } from "./ui/utils";

export const CurrencySpan = ({
  money,
  className,
  ...options
}: {
  money: Money;
  className?: string;
} & Pick<Intl.NumberFormatOptions, "signDisplay" | "currencyDisplay">) => (
  <span className={cn("whitespace-nowrap tabular-nums", className)}>
    {formatCurrency(money, options)}
  </span>
);
