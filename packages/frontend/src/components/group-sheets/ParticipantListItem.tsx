import { clsxtw } from '../../utils/utils';

export const ParticipantListItem = ({
  children,
  avatar,
  className,
}: {
  children: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}) => (
  <div className={clsxtw('flex items-center gap-4', className)}>
    <div>{avatar}</div>
    {children}
  </div>
);
