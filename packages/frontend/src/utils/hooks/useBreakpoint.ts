import { useMedia } from "react-use";
import resolveConfig from "tailwindcss/resolveConfig";

import { config } from "../../../tailwind.config";

const fullConfig = resolveConfig(config);

type Breakpoint = keyof typeof fullConfig.theme.screens;

export const useBreakpoint = (breakpoint: Breakpoint) =>
  useMedia(`(min-width: ${fullConfig.theme.screens[breakpoint]})`);
