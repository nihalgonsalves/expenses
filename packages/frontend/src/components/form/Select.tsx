import { forwardRef } from "react";
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

const UNSET = "unset" as const;

type SelectProps<T extends z.Schema<string | undefined>> = {
  id?: string | undefined;
  placeholder: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  onChange: (newValue: z.infer<T>) => void;
  schema: T;
  className?: string | undefined;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

const SelectInner = <T extends z.Schema<string | undefined>>(
  {
    id,
    placeholder,
    options,
    value,
    onChange: setValue,
    schema,
    className,
    onBlur,
    ...controllerProps
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => (
  <UISelect
    value={value ?? ""}
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

// https://fettblog.eu/typescript-react-generic-forward-refs/
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const Select = forwardRef(SelectInner) as <
  T extends z.Schema<string | undefined>,
>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => ReturnType<typeof SelectInner>;
