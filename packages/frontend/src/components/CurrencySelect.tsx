import {
  FormControl,
  type FormControlProps,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { useCallback, useId } from 'react';

import { CURRENCY_CODES } from '../utils/money';

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
  const currencySelectId = useId();

  const handleChange = useCallback(
    (e: SelectChangeEvent) => {
      setCurrencyCode(e.target.value);
    },
    [setCurrencyCode],
  );

  return (
    <FormControl {...formControlProps}>
      <InputLabel id={currencySelectId}>Currency</InputLabel>
      <Select
        labelId={currencySelectId}
        value={currencyCode}
        label="Currency"
        required
        onChange={handleChange}
      >
        {options.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
