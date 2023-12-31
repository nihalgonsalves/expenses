import { forwardRef } from 'react';
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

type SelectProps<T extends z.Schema<string | undefined>> = {
  id?: string | undefined;
  placeholder: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  setValue: (newValue: z.infer<T>) => void;
  schema: T;
  small?: boolean;
  className?: string | undefined;
  onBlur?: (() => void) | undefined;
};

const SelectInner = <T extends z.Schema<string | undefined>>(
  {
    id,
    placeholder,
    options,
    value,
    setValue,
    schema,
    className,
    onBlur,
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => (
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
    <SelectTrigger id={id} ref={ref} className={className}>
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

// https://fettblog.eu/typescript-react-generic-forward-refs/
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const Select = forwardRef(SelectInner) as <
  T extends z.Schema<string | undefined>,
>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => ReturnType<typeof SelectInner>;
