import React from 'react';

import { clsxtw } from '../../utils/utils';

export const LoadingButton = ({
  isLoading,
  className,
  children,
  ...buttonProps
}: {
  isLoading: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={clsxtw('btn', 'btn-primary', className)}
    {...buttonProps}
  >
    {isLoading ? <span className="loading loading-spinner" /> : children}
  </button>
);
