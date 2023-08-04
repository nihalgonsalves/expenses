import { clsxtw } from '../../utils/utils';

import { Button } from './Button';

const booleanKey = (value: boolean) => (value ? 'true' : 'false');

export const ToggleButtonGroup = <T extends boolean | string>({
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
  <div className={clsxtw('join', className)}>
    {options.map((option) => (
      <Button
        disabled={disabled}
        className={clsxtw(
          'join-item flex-grow',
          value === option.value && 'btn-primary btn-active',
        )}
        aria-checked={value === option.value}
        onClick={() => {
          setValue(option.value);
        }}
        key={
          typeof option.value === 'string'
            ? option.value
            : booleanKey(option.value)
        }
      >
        {option.label}
      </Button>
    ))}
  </div>
);
