import type { ReactNode, Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type SelectOption<T> = {
  label: ReactNode;
  value: T | undefined;
  disabled?: boolean;
};

type SelectProps<T> = {
  id?: string | undefined;
  placeholder?: string;
  options: SelectOption<T>[];
  value: T | undefined;
  onChange: (newValue: T | undefined) => void;
  ref?: Ref<HTMLInputElement> | undefined;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const Select = <T extends string | undefined>({
  ref,
  id,
  placeholder,
  options,
  value,
  onChange,
  ...controllerProps
}: SelectProps<T>) => (
  <UISelect<T>
    {...controllerProps}
    {...(ref && { inputRef: ref })}
    {...(id && { id })}
    items={options}
    value={value ?? null}
    onValueChange={(next) => {
      onChange(next ?? undefined);
    }}
  >
    <SelectTrigger className="w-full">
      {value != null ? (
        <SelectValue />
      ) : (
        <SelectValue>{placeholder}</SelectValue>
      )}
    </SelectTrigger>
    <SelectContent>
      {options.map((opt) => (
        <SelectItem
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled ?? false}
        >
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </UISelect>
);
