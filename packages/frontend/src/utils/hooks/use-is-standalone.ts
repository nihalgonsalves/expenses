import { useMediaQuery } from "@mantine/hooks";

export const useIsStandalone = () =>
  useMediaQuery("(display-mode: standalone)");
