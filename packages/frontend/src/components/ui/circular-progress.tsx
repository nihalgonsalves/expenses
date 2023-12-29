'use client';

import * as React from 'react';

const center = 16;
const strokeWidth = 4;
const r = 16 - strokeWidth;
const c = 2 * r * Math.PI;

type CircularProgressProps = {
  value: number;
  size?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const CircularProgress = ({
  className,
  size = 32,
  value,
}: CircularProgressProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    strokeWidth={strokeWidth}
  >
    <circle
      cx={center}
      cy={center}
      r={r}
      stroke="hsl(var(--primary))"
      strokeDasharray={`${c} ${c}`}
      strokeDashoffset={c - (value / 100) * c}
      strokeLinecap="round"
      transform="rotate(-90 16 16)"
    />
  </svg>
);

export { CircularProgress };
