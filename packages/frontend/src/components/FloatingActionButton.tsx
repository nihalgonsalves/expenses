import React from 'react';
import { Link } from 'react-router-dom';

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
    <Link
      className="btn-outlined btn btn-circle btn-primary absolute bottom-4 right-4 text-2xl"
      aria-label={label}
      to={to}
    >
      <span className="tooltip tooltip-left" data-tip={label}>
        {icon}
      </span>
    </Link>
  </div>
);
