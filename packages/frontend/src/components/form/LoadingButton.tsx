import React from 'react';

import { clsxtw } from '../../utils/utils';

export const LoadingButton = ({
  isLoading,
  className,
  children,
  ...buttonProps
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
  className?: string;
}) => (
  <button
    type="button"
    className={clsxtw('btn', 'btn-primary', className)}
    {...buttonProps}
  >
    {isLoading ? <span className="loading loading-spinner" /> : children}
  </button>
);
