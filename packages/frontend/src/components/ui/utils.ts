import { clsx, type ClassValue } from "clsx";
import type { HTMLProps, ReactElement } from "react";
import { createTwc } from "react-twc";
import { twMerge } from "tailwind-merge";

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const twx = createTwc({ compose: cn });

type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => ReactElement;

export type RenderProp<
  RenderFunctionProps = HTMLProps<HTMLButtonElement>,
  State = unknown,
> = ComponentRenderFn<RenderFunctionProps, State> | ReactElement;
