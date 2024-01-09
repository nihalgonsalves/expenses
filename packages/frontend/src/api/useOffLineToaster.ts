import { useEffect } from "react";
import { toast } from "react-hot-toast";

import { useNavigatorOnLine } from "../state/useNavigatorOnLine";
import { durationMilliseconds } from "../utils/temporal";

const TOAST_ID = "network-toast";

export const useOffLineToaster = () => {
  const onLine = useNavigatorOnLine();

  useEffect(() => {
    if (onLine) {
      toast.success("Connected!", {
        id: TOAST_ID,
        style: {},
        duration: durationMilliseconds({ seconds: 1 }),
      });
    } else {
      toast(() => "Network disconnected", {
        id: TOAST_ID,
        style: {
          backgroundColor: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
        },
      });
    }
  }, [onLine]);
};
