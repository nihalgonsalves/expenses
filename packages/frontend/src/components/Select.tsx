import {
  FormControl,
  type FormControlProps,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  type SelectProps,
} from '@mui/material';
import { useId } from 'react';
import { type z } from 'zod';

export const Select = <T extends z.Schema<string | undefined>>({
  label,
  options,
  value,
  setValue,
  schema,
  small,
  muiSelectProps = {},
  muiFormControlProps = {},
}: {
  label: string;
  options: { display: React.ReactNode; value: z.infer<T> | '' }[];
  value: z.infer<T> | undefined;
  setValue: (newValue: z.infer<T>) => void;
  schema: T;
  small?: boolean;
  muiSelectProps?: Omit<SelectProps, 'size'>;
  muiFormControlProps?: FormControlProps;
}) => {
  const selectId = useId();

  return (
    <FormControl {...muiFormControlProps}>
      <InputLabel id={selectId} size={small ? 'small' : 'normal'}>
        {label}
      </InputLabel>
      <MuiSelect
        labelId={selectId}
        label={label}
        value={value ?? ''}
        onChange={(e) => {
          setValue(e.target.value ? schema.parse(e.target.value) : undefined);
        }}
        SelectDisplayProps={{ style: { display: 'flex', gap: '0.5rem' } }}
        size={small ? 'small' : 'medium'}
        {...muiSelectProps}
      >
        {options.map(({ display, value: optionValue }) => (
          <MenuItem key={optionValue} value={optionValue}>
            {display}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};
