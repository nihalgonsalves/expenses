import type { ComponentProps, ReactNode } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import type { z } from "zod";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type SelectOption<T extends z.ZodType<string>> = {
  label: ReactNode;
  value: z.infer<T> | undefined;
  disabled?: boolean;
};

const UNSET = "unset";

type SelectProps<T extends z.ZodType<string>> = {
  id?: string | undefined;
  placeholder?: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  onChange: (newValue: z.infer<T>) => void;
  schema: T;
  className?: string | undefined;
} & Pick<ComponentProps<typeof SelectTrigger>, "ref"> &
  Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const Select = <T extends z.ZodType<string>>({
  ref,
  id,
  placeholder,
  options,
  value,
  onChange: setValue,
  schema,
  className,
  onBlur,
  ...controllerProps
}: SelectProps<T>) => (
  <UISelect
    value={
      value ??
      // if there's a placeholder, use "" so that the select displays it.
      // if not, fallback a value with `undefined` in it
      (placeholder ? "" : UNSET)
    }
    onValueChange={(newValue) => {
      onBlur();

      if (newValue === "" || newValue === UNSET) {
        setValue(schema.parse(newValue));
        return;
      }
    }}
  >
    <SelectTrigger {...controllerProps} id={id} ref={ref} className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((opt) => (
        <SelectItem
          key={opt.value ?? UNSET}
          value={opt.value ?? UNSET}
          disabled={opt.disabled ?? false}
        >
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </UISelect>
);
