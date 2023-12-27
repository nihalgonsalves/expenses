import { cn, getInitials } from '../utils/utils';

import { Avatar as UIAvatar, AvatarFallback } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const Avatar = ({ name }: { name: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <UIAvatar className="border-2">
          <AvatarFallback className="cursor-pointer">
            {getInitials(name)}
          </AvatarFallback>
        </UIAvatar>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-slate-300">
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const AvatarGroup = ({
  className,
  names,
  max,
}: {
  className?: string;
  names: string[];
  max: number;
}) => {
  const visible = names.slice(0, max);
  const hidden = names.length - visible.length;

  return (
    <div className={cn('flex -space-x-4', className)}>
      {visible.map((name) => (
        <Avatar key={name} name={name} />
      ))}
      {hidden !== 0 && (
        <UIAvatar className="border-2">
          <AvatarFallback className="cursor-pointer">+{hidden}</AvatarFallback>
        </UIAvatar>
      )}
    </div>
  );
};
