import { CircularProgress } from "./circular-progress";
import { cn } from "./utils";

export const LoadingSpinner = ({ className }: { className?: string }) => (
  <CircularProgress
    className={cn(className, "animate-spin")}
    value={80}
    size={24}
    color="primary-foreground"
  />
);
