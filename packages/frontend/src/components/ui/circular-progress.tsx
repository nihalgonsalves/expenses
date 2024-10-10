"use client";

import type * as React from "react";

import type { CssVariableName } from "@nihalgonsalves/expenses-shared/types/theme";

const center = 16;
const strokeWidth = 4;
const r = 16 - strokeWidth;
const c = 2 * r * Math.PI;

type CircularProgressProps = {
  value: number;
  size?: number;
  color?: CssVariableName;
} & React.HTMLAttributes<HTMLDivElement>;

const CircularProgress = ({
  className,
  size = 32,
  value,
  color = "primary",
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
      stroke={`hsl(var(--${color}))`}
      strokeDasharray={`${c} ${c}`}
      strokeDashoffset={c - (value / 100) * c}
      strokeLinecap="round"
      transform="rotate(-90 16 16)"
    />
  </svg>
);

export { CircularProgress };
