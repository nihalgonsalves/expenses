import React, { useCallback, useRef } from 'react';

import { dineroToMoney, type Money } from '@nihalgonsalves/expenses-backend';

import { formatCurrency, toDinero } from '../../utils/money';

import { TextField, type TextFieldProps } from './TextField';

/**
 * this is not Number.MAX_SAFE_INTEGER since we'd have to use a BIGINT in postgres
 * to store values. this doesn't make much sense given that millionaires will
 * not use this to split bills.
 *
 * this is roughly 20 million in an exponent=2 currency like EUR.
 */
const MAX_ALLOWED = 20_000_000_00;

export const MoneyField = ({
  amount,
  setAmount,
  currencyCode,
  ...textFieldProps
}: {
  amount: number;
  currencyCode: string;
  setAmount: (newAmount: number) => void;
} & Omit<
  TextFieldProps,
  'value' | 'setValue' | 'inputRef' | 'inputMode' | 'onKeyDown'
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
            // Special case for when the entire value is selected, we can replace
            // or clear the entire value. Partial selections are not supported
            if (selectionStart === 0 && selectionEnd === length) {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                return '0';
              } else if (e.key.match(/^[0-9]$/)) {
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

          if (e.key === 'Backspace') {
            return amountAsString.slice(0, -1) || '0';
          } else if (e.key.match(/^[0-9]$/)) {
            return `${amountAsString}${e.key}`;
          }

          return amountAsString;
        })();

        const newValueInt = parseInt(newValue, 10);

        if (newValueInt <= MAX_ALLOWED) {
          setAmount(newValueInt);
        }
      },
      [amount, setAmount],
    );

  const moneySnapshot: Money = dineroToMoney(toDinero(amount, currencyCode));

  return (
    <TextField
      {...textFieldProps}
      inputRef={inputRef}
      inputMode="numeric"
      value={formatCurrency(moneySnapshot)}
      setValue={() => {
        // noop
      }}
      onKeyDown={handleAmountKeyDown}
    />
  );
};
