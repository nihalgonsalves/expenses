import { useMemo } from 'react';
import { z } from 'zod';

import { CURRENCY_CODES } from '../../utils/money';

import { Select } from './Select';

export const CurrencySelect = ({
  currencyCode,
  setCurrencyCode,
  options = CURRENCY_CODES,
}: {
  currencyCode: string;
  setCurrencyCode: (newCode: string) => void;
  options?: string[];
}) => {
  const optionDownProp = useMemo(
    () =>
      options.map((o) => ({
        value: o,
        label: o,
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
    />
  );
};
