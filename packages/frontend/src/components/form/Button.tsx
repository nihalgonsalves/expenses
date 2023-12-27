import { Button as UIButton, type ButtonProps } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';

export const Button = ({
  isLoading,
  className,
  children,
  type = 'button',
  ...buttonProps
}: ButtonProps & {
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  className?: string;
}) => (
  <UIButton type={type} className={className} {...buttonProps}>
    {isLoading ? <LoadingSpinner /> : children}
  </UIButton>
);
