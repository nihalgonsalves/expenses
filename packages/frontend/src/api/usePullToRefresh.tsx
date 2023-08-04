import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useIsStandalone } from '../utils/hooks/useIsStandalone';

export const usePullToRefresh = (
  toastId: string,
  onRefetch: () => Promise<void>,
) => {
  const isStandalone = useIsStandalone();

  const touchStartYRef = useRef(0);
  const touchDiffYRef = useRef(0);

  useEffect(() => {
    if (!isStandalone) {
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
      const displayThreshold = window.innerHeight * 0.05;
      const reloadThreshold = window.innerHeight * 0.4;

      touchDiffYRef.current = touchDiffY;
      if (touchDiffY > displayThreshold) {
        const ratio = touchDiffY / reloadThreshold;

        toast(
          () => (
            <div
              className="radial-progress"
              style={{
                // @ts-expect-error DaisyUI property
                '--value': ratio * 100,
                '--size': '1rem',
              }}
            />
          ),
          {
            id: toastId,
            duration: Infinity,
            style: {
              backgroundColor: `rgba(255, 255, 255, ${ratio.toFixed(2)})`,
            },
          },
        );
      } else {
        toast.dismiss(toastId);
      }
    };

    const onTouchEnd = () => {
      const reloadThreshold = window.innerHeight * 0.4;

      if (touchDiffYRef.current > reloadThreshold) {
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
  }, [toastId, onRefetch, isStandalone]);
};
