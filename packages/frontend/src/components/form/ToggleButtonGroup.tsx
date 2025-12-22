import type { ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

export const ToggleButtonGroup = <T extends string>({
  className,
  options,
  value,
  setValue,
  disabled,
}: {
  className?: string;
  options: readonly { value: T; label: ReactNode }[];
  value: T;
  setValue: (newValue: T) => void;
  disabled?: boolean;
}) => (
  <ToggleGroup<T>
    {...(className && { className })}
    variant="outline"
    value={[value]}
    onValueChange={([newVal]) => {
      if (newVal) {
        setValue(newVal);
      }
    }}
  >
    {options.map((option) => (
      <ToggleGroupItem
        key={option.value}
        value={option.value}
        {...(disabled && { disabled })}
      >
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);
