import { easeIn } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useDialog } from "../components/form/ResponsiveDialog";
import { CircularProgress } from "../components/ui/circular-progress";
import { useIsStandalone } from "../utils/hooks/useIsStandalone";
import { noop } from "../utils/utils";

const displayThreshold = () => window.innerHeight * 0.05;
const reloadThreshold = () => window.innerHeight * 0.4;
const inverseReloadThreshold = () => window.innerHeight * 0.6;

const LoaderToast = ({ ratio }: { ratio: number }) => (
  <div className="flex items-center justify-center">
    <CircularProgress size={24} value={ratio * 100} />
    <span className="grow text-center">
      {ratio < 0.99999 ? "Pull to Refresh" : "Release to Refresh"}
    </span>
  </div>
);

export const usePullToRefresh = (toastId: string, onRefetch: () => void) => {
  const dialog = useDialog();
  const isStandalone = useIsStandalone();

  const touchStartYRef = useRef(0);
  const touchDiffYRef = useRef(0);

  useEffect(() => {
    if (!isStandalone || dialog.isOpen) {
      return noop;
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

        toast(<LoaderToast ratio={ratio} />, {
          id: toastId,
          duration: Infinity,
          classNames: {
            content: "w-full",
          },
          style: {
            border: "none",
            color: `rgba(from var(--foreground) r g b / ${ratio.toFixed(2)})`,
            backgroundColor: `rgba(from var(--background) r g b / ${ratio.toFixed(2)})`,
          },
        });
      } else {
        toast.dismiss(toastId);
      }
    };

    const onTouchEnd = () => {
      if (touchDiffYRef.current > reloadThreshold()) {
        onRefetch();
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
