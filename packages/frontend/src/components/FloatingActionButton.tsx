import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const MotionButton = motion(Button);

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

export const FloatingActionButton = ({
  to,
  onClick,
  label,
  icon,
}: FloatingActionButtonProps) => (
  <div className="sticky bottom-0 w-full">
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger className="absolute bottom-4 right-4">
          {to ? (
            <MotionButton
              asChild
              variant="outline"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="size-12 rounded-full text-2xl"
              aria-label={label}
            >
              <Link to={to}>{icon}</Link>
            </MotionButton>
          ) : (
            <MotionButton
              variant="outline"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className="size-12 rounded-full text-2xl"
              aria-label={label}
              onClick={onClick}
            >
              {icon}
            </MotionButton>
          )}
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-slate-300">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);
