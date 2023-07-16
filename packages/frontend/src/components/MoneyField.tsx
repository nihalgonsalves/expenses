import { TextField, type TextFieldProps } from '@mui/material';
import React, { useCallback, useRef } from 'react';

import { dineroToMoney, type Money } from '@nihalgonsalves/expenses-backend';

import { formatCurrency, toDinero } from '../utils/money';

export const MoneyField = ({
  amount,
  setAmount,
  currencyCode,
  ...textFieldProps
}: {
  amount: number;
  currencyCode: string;
  setAmount: (newAmount: number) => void;
} & Pick<
  TextFieldProps,
  'fullWidth' | 'autoFocus' | 'label' | 'size' | 'sx' | 'error'
>) => {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * This solves the problem of displaying a formatted currency value while
   * still storing the value as a money (dinero) object. This allows the value
   * to be rendered with currency symbols and commas without having to strip
   * them out and reparse on every change, and without having to be aware of
   * whether the current locale uses commas or periods as decimal separators.
   */
  const handleAmountKeyDown: React.KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const element = inputRef.current;
        if (!element) {
          return;
        }

        const amountAsString = amount.toFixed(0);

        const newValue: string = (() => {
          const {
            selectionStart,
            selectionEnd,
            value: { length },
          } = element;

          const hasSelection = selectionStart !== selectionEnd;

          if (hasSelection) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              // Special case for clearing the field (select all, delete/backspace).
              // This doesn't support deleting individual selections because that would
              // go back to trying to reverse engineer the formatted value.
              return selectionStart === 0 && selectionEnd === length
                ? '0'
                : amountAsString;
            }
          } else if (selectionEnd !== length) {
            // Don't allow editing the value in the middle of the string
            element.setSelectionRange(length, length);
            return amountAsString;
          }

          if (e.key === 'Backspace') {
            return amountAsString.slice(0, -1) || '0';
          } else if (e.key.match(/^[0-9]$/)) {
            return `${amountAsString}${e.key}`;
          }

          return amountAsString;
        })();

        const newValueInt = parseInt(newValue, 10);

        if (newValueInt <= Number.MAX_SAFE_INTEGER) {
          setAmount(newValueInt);
        }
      },
      [amount, setAmount],
    );

  const moneySnapshot: Money = dineroToMoney(toDinero(amount, currencyCode));

  return (
    <TextField
      fullWidth
      inputRef={inputRef}
      inputProps={{ inputMode: 'numeric' }}
      value={formatCurrency(moneySnapshot, {
        currencyDisplay: 'narrowSymbol',
      })}
      onKeyDown={handleAmountKeyDown}
      {...textFieldProps}
    />
  );
};
