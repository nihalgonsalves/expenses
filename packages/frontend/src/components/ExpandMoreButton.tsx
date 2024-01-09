import { ChevronDownIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import { Button } from "./ui/button";

type ExpandMoreProps = {
  expand: boolean;
  onClick: () => void;
};

export const ExpandMoreButton = ({ expand, onClick }: ExpandMoreProps) => (
  <Button
    onClick={onClick}
    aria-expanded={expand}
    aria-label="show more"
    className="text-xl"
    $variant="ghost"
  >
    <motion.span animate={expand ? { rotate: 180 } : { rotate: 0 }}>
      <ChevronDownIcon />
    </motion.span>
  </Button>
);
