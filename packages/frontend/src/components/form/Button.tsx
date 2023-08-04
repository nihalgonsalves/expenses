import { type HTMLMotionProps, motion } from 'framer-motion';

import { clsxtw } from '../../utils/utils';

export const Button = ({
  isLoading,
  className,
  children,
  ...buttonProps
}: Omit<HTMLMotionProps<'button'>, 'type' | 'style'> & {
  type?: 'submit' | 'reset';
  isLoading?: boolean;
  className?: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.8 }}
    type="button"
    className={clsxtw('btn no-animation', className)}
    {...buttonProps}
  >
    {isLoading ? <span className="loading loading-spinner" /> : children}
  </motion.button>
);
