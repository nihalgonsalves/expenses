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
  <li className={cn("flex items-center gap-4", className)}>
    <div>{avatar}</div>
    {children}
  </li>
);
