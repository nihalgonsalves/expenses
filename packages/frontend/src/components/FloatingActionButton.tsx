import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

export const FloatingActionButton = ({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <div className="sticky bottom-0 w-full">
    <span
      className="absolute bottom-4 right-4 tooltip tooltip-left"
      data-tip={label}
    >
      <MotionLink
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.8 }}
        className="btn-outlined btn btn-circle btn-primary text-2xl"
        aria-label={label}
        to={to}
      >
        {icon}
      </MotionLink>
    </span>
  </div>
);
