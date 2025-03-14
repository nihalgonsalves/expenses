import type { ReactNode } from "react";

import { cn } from "../ui/utils";

export const ParticipantListItem = ({
  children,
  avatar,
  className,
}: {
  children: ReactNode;
  avatar?: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-4", className)} role="listitem">
    <div>{avatar}</div>
    {children}
  </div>
);
