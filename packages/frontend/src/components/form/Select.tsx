import type { ControllerRenderProps } from "react-hook-form";
import type { z } from "zod";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type SelectOption<T extends z.Schema<string | undefined>> = {
  label: React.ReactNode;
  value: z.infer<T> | undefined;
  disabled?: boolean;
};

const UNSET = "unset";

type SelectProps<T extends z.Schema<string | undefined>> = {
  id?: string | undefined;
  placeholder?: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  onChange: (newValue: z.infer<T>) => void;
  schema: T;
  className?: string | undefined;
} & Pick<React.ComponentProps<typeof SelectTrigger>, "ref"> &
  Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const Select = <T extends z.Schema<string | undefined>>({
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
      setValue(
        newValue !== "" && newValue !== UNSET
          ? schema.parse(newValue)
          : undefined,
      );
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
