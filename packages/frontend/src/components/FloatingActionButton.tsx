import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";

const MotionButton = motion.create(Button);

type FloatingActionButtonProps = {
  label: string;
  icon: React.ReactNode;
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

export const FloatingActionButton = React.forwardRef<
  HTMLDivElement,
  FloatingActionButtonProps
>(({ to, onClick, label, icon }, ref) => (
  <div ref={ref} className="sticky bottom-0 w-full">
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {to ? (
            <MotionButton
              asChild
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute bottom-4 right-4 size-12 rounded-full text-2xl"
            >
              <Link to={to}>
                <AccessibleIcon label={label}>{icon}</AccessibleIcon>
              </Link>
            </MotionButton>
          ) : (
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="absolute bottom-4 right-4 size-12 rounded-full text-2xl"
              onClick={onClick}
            >
              <AccessibleIcon label={label}>{icon}</AccessibleIcon>
            </MotionButton>
          )}
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={4}
          className="bg-primary text-primary-foreground"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
));
FloatingActionButton.displayName = "FloatingActionButton";
