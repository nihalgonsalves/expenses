import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode, Ref } from "react";

import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

const MotionButton = motion.create(Button);

type FloatingActionButtonProps = {
  ref?: Ref<HTMLDivElement>;
  label: string;
  icon: ReactNode;
} & (
  | {
      to: string;
      onClick?: undefined;
    }
  | {
      to?: undefined;
      onClick: () => void;
    }
  | {
      to?: undefined;
      onClick?: undefined;
    }
);

export const FloatingActionButton = ({
  ref,
  to,
  onClick,
  label,
  icon,
}: FloatingActionButtonProps) => (
  <div ref={ref} className="sticky bottom-0 w-full">
    <Tooltip>
      <TooltipTrigger
        render={
          to ? (
            <MotionButton
              asChild
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute right-4 bottom-4 size-12 rounded-full text-2xl"
            >
              <Link to={to}>
                <AccessibleIcon label={label}>{icon}</AccessibleIcon>
              </Link>
            </MotionButton>
          ) : (
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute right-4 bottom-4 size-12 rounded-full text-2xl"
              onClick={onClick}
            >
              <AccessibleIcon label={label}>{icon}</AccessibleIcon>
            </MotionButton>
          )
        }
      />
      <TooltipContent side="left" sideOffset={4}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);
