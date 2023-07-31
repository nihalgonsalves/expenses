import { type FormControlProps } from '@mui/material';
import { useMemo } from 'react';
import { z } from 'zod';

import { CURRENCY_CODES } from '../utils/money';

import { Select } from './Select';

export const CurrencySelect = ({
  currencyCode,
  setCurrencyCode,
  options = CURRENCY_CODES,
  ...formControlProps
}: {
  currencyCode: string;
  setCurrencyCode: (newCode: string) => void;
  options?: string[];
} & FormControlProps) => {
  const optionDownProp = useMemo(
    () =>
      options.map((o) => ({
        value: o,
        display: o,
      })),
    [options],
  );

  return (
    <Select
      label="Currency"
      value={currencyCode}
      setValue={setCurrencyCode}
      options={optionDownProp}
      schema={z.string()}
      muiFormControlProps={formControlProps}
    />
  );
};
