import { useNetworkState } from 'react-use';

export const useNavigatorOnLine = () => {
  const { online } = useNetworkState();

  return online;
};
