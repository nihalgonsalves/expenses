import { motion, AnimatePresence } from 'framer-motion';
import React, { useCallback, useId } from 'react';

import { clsxtw } from '../../utils/utils';

export type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value'
> & {
  label: React.ReactNode;
  labelAlt?: React.ReactNode;
  bottomLabel?: React.ReactNode;
  value: string;
  setValue: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  inputRef?: React.Ref<HTMLInputElement>;
};

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
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  return (
    <div className={clsxtw('form-control', className)}>
      <AnimatePresence>
        {(label != null || labelAlt != null) && (
          <motion.label
            key={`${id}-top-label`}
            className="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="label-text">{label}</span>
            <span className="label-text-alt">{labelAlt}</span>
          </motion.label>
        )}

        <input
          type="text"
          className={clsxtw('input', 'input-bordered', inputClassName)}
          value={value}
          onChange={handleChange}
          ref={inputRef}
          {...inputProps}
        />

        {bottomLabel != null && (
          <motion.label
            key={`${id}-bottom-label`}
            className="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="label-text">{bottomLabel}</span>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
};
