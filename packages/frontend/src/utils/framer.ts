import type { MotionProps } from "framer-motion";

export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.1 },
} satisfies MotionProps;

export const scaleOut = {
  initial: { scale: 0.8, opacity: 1 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { duration: 0.3 },
} satisfies MotionProps;

export const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} satisfies MotionProps;
