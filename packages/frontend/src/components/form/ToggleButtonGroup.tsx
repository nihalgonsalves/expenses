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
  <ToggleGroup
    type="single"
    variant="outline"
    className={className}
    value={value}
    onValueChange={(newVal) => {
      // https://www.radix-ui.com/primitives/docs/components/toggle-group#ensuring-there-is-always-a-value
      if (newVal) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        setValue(newVal as T);
      }
    }}
  >
    {options.map((option) => (
      <ToggleGroupItem
        key={option.value}
        disabled={disabled}
        value={option.value}
      >
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);
