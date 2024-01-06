import { easeIn } from 'framer-motion';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { CircularProgress } from '../components/ui/circular-progress';
import { vaulDrawerOpenAtom } from '../state/theme';
import { useIsStandalone } from '../utils/hooks/useIsStandalone';

const displayThreshold = () => window.innerHeight * 0.05;
const reloadThreshold = () => window.innerHeight * 0.4;
const inverseReloadThreshold = () => window.innerHeight * 0.6;

export const usePullToRefresh = (
  toastId: string,
  onRefetch: () => Promise<void>,
) => {
  const [vaulDrawerOpen] = useAtom(vaulDrawerOpenAtom);
  const isStandalone = useIsStandalone();

  const touchStartYRef = useRef(0);
  const touchDiffYRef = useRef(0);

  useEffect(() => {
    if (!isStandalone || vaulDrawerOpen) {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      const clientY = e.touches[0]?.clientY;
      if (clientY == null) return;

      touchStartYRef.current = clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const clientY = e.touches[0]?.clientY;
      if (clientY == null) return;

      const touchDiffY = clientY - touchStartYRef.current;

      touchDiffYRef.current = touchDiffY;

      if (
        // if the touch started at over 60% of the screen height,
        // theres no chance the user will be able to cross more than 40% of the screen height
        touchStartYRef.current < inverseReloadThreshold() &&
        touchDiffY > displayThreshold()
      ) {
        const ratio = easeIn(touchDiffY / reloadThreshold());

        toast(() => <CircularProgress size={24} value={ratio * 100} />, {
          id: toastId,
          className: 'w-48',
          duration: Infinity,
          style: {
            backgroundColor: `rgba(255, 255, 255, ${ratio.toFixed(2)})`,
          },
        });
      } else {
        toast.dismiss(toastId);
      }
    };

    const onTouchEnd = () => {
      if (touchDiffYRef.current > reloadThreshold()) {
        void onRefetch();
      } else {
        toast.dismiss(toastId);
      }

      touchStartYRef.current = 0;
      touchDiffYRef.current = 0;
    };

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [toastId, onRefetch, isStandalone, vaulDrawerOpen]);
};
