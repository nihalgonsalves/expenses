import { useMedia } from "react-use";

// See https://github.com/tailwindlabs/tailwindcss/discussions/14764
// This used to use v3's resolveConfig. This should be replaced with a build
// time config once a solution exists.
//
// var(--breakpoint-*) doesn't work because you can't use a CSS variable in a
// media query

/**
 * Default breakpoints from Tailwind CSS
 * https://tailwindcss.com/docs/responsive-design
 */
const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const satisfies Record<string, `${number}px`>;

export const useBreakpoint = (breakpoint: keyof typeof breakpoints) =>
  useMedia(`(min-width: ${breakpoints[breakpoint]})`);
