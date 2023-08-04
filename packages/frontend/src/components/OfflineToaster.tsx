import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { useNavigatorOnLine } from '../utils/hooks/useNavigatorOnLine';

const TOAST_ID = 'network-toast';

export const OfflineToaster = () => {
  const onLine = useNavigatorOnLine();

  useEffect(() => {
    if (onLine) {
      toast.success('Connected!', {
        id: TOAST_ID,
        style: {},
        duration: 1_000,
      });
    } else {
      toast(() => 'You are offline', {
        id: TOAST_ID,
        style: {
          color: 'hsl(var(--wa))',
        },
        duration: Infinity,
      });
    }
  }, [onLine]);

  return null;
};
