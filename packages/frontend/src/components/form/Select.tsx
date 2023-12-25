import { useId } from 'react';
import type { z } from 'zod';

import { Label } from '../ui/label';
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export type SelectOption<T extends z.Schema<string | undefined>> = {
  label: React.ReactNode;
  value: z.infer<T> | undefined;
  disabled?: boolean;
};

const UNSET = 'unset' as const;

export const Select = <T extends z.Schema<string | undefined>>({
  label,
  options,
  value,
  setValue,
  schema,
}: {
  label: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  setValue: (newValue: z.infer<T>) => void;
  schema: T;
  small?: boolean;
}) => {
  const id = useId();

  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <UISelect
        value={value ?? ''}
        onValueChange={(newValue) => {
          setValue(
            newValue !== '' && newValue !== UNSET
              ? schema.parse(newValue)
              : undefined,
          );
        }}
      >
        <SelectTrigger>
          <SelectValue id={id} placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ label: display, value: optValue, disabled }) => (
            <SelectItem
              key={optValue}
              value={optValue ?? UNSET}
              disabled={disabled ?? false}
            >
              {display}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    </>
  );
};
