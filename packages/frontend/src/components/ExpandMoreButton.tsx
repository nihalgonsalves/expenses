import { motion } from 'framer-motion';
import { MdExpandMore } from 'react-icons/md';

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
      <MdExpandMore />
    </motion.span>
  </Button>
);
