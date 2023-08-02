import React, { useCallback } from 'react';

import { clsxtw } from '../../utils/utils';

export type TextFieldProps = {
  label: React.ReactNode;
  labelAlt?: React.ReactNode;
  bottomLabel?: React.ReactNode;
  value: string;
  setValue: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

export const TextField = ({
  label,
  labelAlt,
  bottomLabel,
  value,
  setValue,
  className,
  inputClassName,
  inputRef,
  ...inputProps
}: TextFieldProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  return (
    <div className={clsxtw('form-control', className)}>
      {(label || labelAlt) && (
        <label className="label">
          <span className="label-text">{label}</span>
          <span className="label-text-alt">{labelAlt}</span>
        </label>
      )}

      <input
        type="text"
        className={clsxtw('input', 'input-bordered', inputClassName)}
        value={value}
        onChange={handleChange}
        ref={inputRef}
        {...inputProps}
      />

      {bottomLabel && (
        <label className="label">
          <span className="label-text">{bottomLabel}</span>
        </label>
      )}
    </div>
  );
};