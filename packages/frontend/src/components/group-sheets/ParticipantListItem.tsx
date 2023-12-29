import { cn } from '../ui/utils';

export const ParticipantListItem = ({
  children,
  avatar,
  className,
}: {
  children: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex items-center gap-4', className)}>
    <div>{avatar}</div>
    {children}
  </div>
);
