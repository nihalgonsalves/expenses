import { useNetworkState } from 'react-use';

export const useNavigatorOnLine = () => {
  const { online } = useNetworkState();

  console.log({ online });
  return online;
};
