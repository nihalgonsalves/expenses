import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from './form/Button';

const MotionLink = motion(Link);

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
);

export const FloatingActionButton = ({
  to,
  onClick,
  label,
  icon,
}: FloatingActionButtonProps) => (
  <div className="sticky bottom-0 w-full">
    <span
      className="absolute bottom-4 right-4 tooltip tooltip-left"
      data-tip={label}
    >
      {to ? (
        <MotionLink
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          className="btn-outlined btn btn-circle btn-primary text-2xl"
          aria-label={label}
          to={to}
        >
          {icon}
        </MotionLink>
      ) : (
        <Button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          className="btn-outlined btn btn-circle btn-primary text-2xl"
          aria-label={label}
          onClick={onClick}
        >
          {icon}
        </Button>
      )}
    </span>
  </div>
);
