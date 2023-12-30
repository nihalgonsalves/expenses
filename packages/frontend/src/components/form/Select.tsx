import type { z } from 'zod';

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
  id,
  placeholder,
  options,
  value,
  setValue,
  schema,
  className,
  onBlur,
}: {
  id?: string | undefined;
  placeholder: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  setValue: (newValue: z.infer<T>) => void;
  schema: T;
  small?: boolean;
  className?: string | undefined;
  onBlur?: (() => void) | undefined;
}) => (
  <UISelect
    value={value ?? ''}
    onValueChange={(newValue) => {
      onBlur?.();
      setValue(
        newValue !== '' && newValue !== UNSET
          ? schema.parse(newValue)
          : undefined,
      );
    }}
  >
    <SelectTrigger id={id} className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(({ label: display, value: optValue, disabled }) => (
        <SelectItem
          key={optValue ?? UNSET}
          value={optValue ?? UNSET}
          disabled={disabled ?? false}
        >
          {display}
        </SelectItem>
      ))}
    </SelectContent>
  </UISelect>
);
