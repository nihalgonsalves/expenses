import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useId } from 'react';

import { Input } from '../ui/input';
import { Label } from '../ui/label';

export type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value'
> & {
  label: React.ReactNode;
  labelAlt?: React.ReactNode;
  bottomLabel?: React.ReactNode;
  value: string;
  setValue: (newValue: string) => void;
  inputClassName?: string;
  inputRef?: React.Ref<HTMLInputElement>;
};

const MotionLabel = motion(Label);

export const TextField = ({
  label,
  labelAlt,
  bottomLabel,
  value,
  setValue,
  inputClassName,
  inputRef,
  ...inputProps
}: TextFieldProps) => {
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  return (
    <AnimatePresence>
      {(label != null || labelAlt != null) && (
        <MotionLabel
          key={`${id}-top-label`}
          htmlFor={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {label}
          <span className="text-right text-xs text-gray-400">{labelAlt}</span>
        </MotionLabel>
      )}

      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        ref={inputRef}
        className={inputClassName}
        {...inputProps}
      />

      {bottomLabel != null && (
        <MotionLabel
          key={`${id}-bottom-label`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span>{bottomLabel}</span>
        </MotionLabel>
      )}
    </AnimatePresence>
  );
};
