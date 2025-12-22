import { getInitials } from "../utils/utils";

import { Avatar as UIAvatar, AvatarFallback } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "./ui/utils";

export const Avatar = ({ name }: { name: string }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <UIAvatar
          className="border-primary border"
          render={
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            <button type="button" />
          }
        >
          <AvatarFallback className="cursor-pointer">
            {getInitials(name)}
          </AvatarFallback>
        </UIAvatar>
      }
    />
    <TooltipContent side="left">{name}</TooltipContent>
  </Tooltip>
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
    <TooltipProvider>
      <div className={cn("flex -space-x-4", className)}>
        {visible.map(({ id, name }) => (
          <Avatar key={id} name={name} />
        ))}
        {hidden !== 0 && (
          <UIAvatar className="border-2">
            <AvatarFallback className="cursor-pointer">
              +{hidden}
            </AvatarFallback>
          </UIAvatar>
        )}
      </div>
    </TooltipProvider>
  );
};
