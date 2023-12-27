import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';

export const ToggleButtonGroup = <T extends string>({
  className,
  options,
  value,
  setValue,
  disabled,
}: {
  className?: string;
  options: readonly { value: T; label: React.ReactNode }[];
  value: T;
  setValue: (newValue: T) => void;
  disabled?: boolean;
}) => (
  <ToggleGroup
    type="single"
    variant="outline"
    className={className}
    value={value}
    onValueChange={setValue}
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
