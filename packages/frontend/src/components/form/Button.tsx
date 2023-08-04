import React from 'react';

import { clsxtw } from '../../utils/utils';

export const Button = ({
  isLoading,
  className,
  children,
  ...buttonProps
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  type?: 'submit' | 'reset';
  isLoading?: boolean;
  className?: string;
}) => (
  <button type="button" className={clsxtw('btn', className)} {...buttonProps}>
    {isLoading ? <span className="loading loading-spinner" /> : children}
  </button>
);
