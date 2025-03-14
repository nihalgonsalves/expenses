import { useEffect, useRef, useState, type Ref } from "react";

import {
  dineroToMoney,
  type Money,
} from "@nihalgonsalves/expenses-shared/money";

import { formatCurrency, toDinero } from "../../utils/money";
import { Input, type InputProps } from "../ui/input";

/**
 * this is not Number.MAX_SAFE_INTEGER since we'd have to use a BIGINT in postgres
 * to store values. this doesn't make much sense given that millionaires will
 * not use this to split bills.
 *
 * this is roughly 20 million in an exponent=2 currency like EUR.
 */
const MAX_ALLOWED = 20_000_000_00;

type MoneyFieldProps = Omit<
  InputProps,
  "inputMode" | "ref" | "onKeyDown" | "onChange" | "value"
> & {
  value: number;
  onChange: (newAmount: number) => void;
  currencyCode: string;
  mode?: "onChange" | "onBlur";
  ref?: Ref<HTMLDivElement>;
};

export const MoneyField = ({
  value,
  onChange: setAmount,
  currencyCode,
  mode = "onChange",
  autoFocus,
  ...textFieldProps
}: MoneyFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [localAmount, setLocalAmount] = useState(value);

  const inputMountRef = (element: HTMLInputElement | null) => {
    inputRef.current = element;

    // Hack for autoFocus not actually working within dialogs or drawers in
    // this case. I'm unsure what went wrong, but this started happening with
    // React 19
    if (autoFocus && element) {
      setTimeout(() => {
        element.focus();
      }, 100);
    }
  };

  useEffect(() => {
    setLocalAmount(value);
  }, [value]);

  const onChange = (newAmount: number) => {
    setLocalAmount(newAmount);
    if (mode === "onChange") {
      setAmount(newAmount);
    }
  };

  const onBlur = () => {
    if (mode === "onBlur") {
      setAmount(localAmount);
    }
  };

  /**
   * This solves the problem of displaying a formatted currency value while
   * still storing the value as a money (dinero) object. This allows the value
   * to be rendered with currency symbols and commas without having to strip
   * them out and reparse on every change, and without having to be aware of
   * whether the current locale uses commas or periods as decimal separators.
   */
  const handleAmountKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    const amountAsString = localAmount.toFixed(0);

    const newValue: string = (() => {
      const {
        selectionStart,
        selectionEnd,
        value: { length },
      } = element;

      const hasSelection = selectionStart !== selectionEnd;

      if (hasSelection) {
        // Special case for when the entire value is selected, we can replace
        // or clear the entire value. Partial selections are not supported
        if (selectionStart === 0 && selectionEnd === length) {
          if (e.key === "Backspace" || e.key === "Delete") {
            return "0";
          } else if (/^[0-9]$/.exec(e.key)) {
            return e.key;
          }
        } else {
          return amountAsString;
        }
      } else if (selectionEnd !== length) {
        // Don't allow editing the value in the middle of the string
        element.setSelectionRange(length, length);
        return amountAsString;
      }

      if (e.key === "Backspace") {
        return amountAsString.slice(0, -1) || "0";
      } else if (/^[0-9]$/.exec(e.key)) {
        return `${amountAsString}${e.key}`;
      }

      return amountAsString;
    })();

    const newValueInt = parseInt(newValue, 10);

    if (newValueInt <= MAX_ALLOWED) {
      onChange(newValueInt);
    }
  };

  const moneySnapshot: Money = dineroToMoney(
    toDinero(localAmount, currencyCode),
  );

  return (
    <Input
      {...textFieldProps}
      ref={inputMountRef}
      className="tabular-nums"
      inputMode="numeric"
      value={formatCurrency(moneySnapshot)}
      onBlur={(e) => {
        onBlur();
        textFieldProps.onBlur?.(e);
      }}
      onChange={() => {
        // noop: not required with onKeyDown, but:
        // Warning: You provided a `value` prop to a form field without an `onChange` handler.
        // This will render a read-only field. If the field should be mutable use `defaultValue`.
        // Otherwise, set either `onChange` or `readOnly`.
      }}
      onKeyDown={handleAmountKeyDown}
    />
  );
};
