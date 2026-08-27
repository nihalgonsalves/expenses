import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { haptics } from "bzzz";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { MouseEventHandler, ReactNode, Ref } from "react";

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
      onClick: MouseEventHandler<HTMLButtonElement>;
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
              role="link"
              nativeButton={false}
              onClick={() => {
                haptics.selection();
              }}
              render={
                <Link to={to}>
                  <AccessibleIcon label={label}>{icon}</AccessibleIcon>
                </Link>
              }
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute right-4 bottom-4 size-12 rounded-full text-2xl"
            />
          ) : (
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute right-4 bottom-4 size-12 rounded-full text-2xl"
              onClick={(e) => {
                haptics.selection();
                onClick?.(e);
              }}
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
