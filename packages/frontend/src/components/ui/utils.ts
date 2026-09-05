import type { HTMLProps, ReactElement } from "react";
import { createTwc } from "react-twc";
import { cn } from "cnfast";

export { cn };
export const twx = createTwc({ compose: cn });

type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => ReactElement;

export type RenderProp<
  RenderFunctionProps = HTMLProps<HTMLButtonElement>,
  State = unknown,
> = ComponentRenderFn<RenderFunctionProps, State> | ReactElement;
