import { easeIn } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { useDialog } from "../components/form/ResponsiveDialog";
import { CircularProgress } from "../components/ui/circular-progress";
import { useIsStandalone } from "../utils/hooks/useIsStandalone";

const displayThreshold = () => window.innerHeight * 0.05;
const reloadThreshold = () => window.innerHeight * 0.4;
const inverseReloadThreshold = () => window.innerHeight * 0.6;

export const usePullToRefresh = (
  toastId: string,
  onRefetch: () => Promise<void>,
) => {
  const dialog = useDialog();
  const isStandalone = useIsStandalone();

  const touchStartYRef = useRef(0);
  const touchDiffYRef = useRef(0);

  useEffect(() => {
    if (!isStandalone || dialog.isOpen) {
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
          className: "w-48",
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

    const abortController = new AbortController();
    const options = { signal: abortController.signal };

    window.addEventListener("touchstart", onTouchStart, options);
    window.addEventListener("touchmove", onTouchMove, options);
    window.addEventListener("touchend", onTouchEnd, options);

    return () => {
      abortController.abort();
    };
  }, [toastId, onRefetch, isStandalone, dialog.isOpen]);
};
