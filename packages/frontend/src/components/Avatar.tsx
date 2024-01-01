import { getInitials } from '../utils/utils';

import { Avatar as UIAvatar, AvatarFallback } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from './ui/utils';

export const Avatar = ({ name }: { name: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <UIAvatar className="border border-primary">
          <AvatarFallback className="cursor-pointer">
            {getInitials(name)}
          </AvatarFallback>
        </UIAvatar>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-primary text-primary-foreground"
      >
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const AvatarGroup = ({
  className,
  users,
  max,
}: {
  className?: string;
  users: { id: string; name: string }[];
  max: number;
}) => {
  const visible = users.slice(0, max);
  const hidden = users.length - visible.length;

  return (
    <div className={cn('flex -space-x-4', className)}>
      {visible.map(({ id, name }) => (
        <Avatar key={id} name={name} />
      ))}
      {hidden !== 0 && (
        <UIAvatar className="border-2">
          <AvatarFallback className="cursor-pointer">+{hidden}</AvatarFallback>
        </UIAvatar>
      )}
    </div>
  );
};
