import { useNetwork } from "@mantine/hooks";

export const useNavigatorOnLine = () => {
  const { online } = useNetwork();

  return online;
};
