import { ChevronDownIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';

import { Button } from './form/Button';

type ExpandMoreProps = {
  expand: boolean;
  onClick: () => void;
};

export const ExpandMoreButton = ({ expand, onClick }: ExpandMoreProps) => (
  <Button
    onClick={onClick}
    aria-expanded={expand}
    aria-label="show more"
    className="btn-ghost text-xl"
  >
    <motion.span animate={expand ? { rotate: 180 } : { rotate: 0 }}>
      <ChevronDownIcon />
    </motion.span>
  </Button>
);
