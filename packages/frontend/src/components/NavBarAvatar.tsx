import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { AvatarIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { useResetCache } from '../api/useCacheReset';
import { useCurrentUser } from '../api/useCurrentUser';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';

export const LoggedOutNavBarAvatar = ({
  className,
}: {
  className?: string | undefined;
}) => (
  <div className={cn('flex place-items-center gap-4', className)}>
    <Separator orientation="vertical">&nbsp;</Separator>

    <Button
      $variant="outline"
      className="text-primary-foreground bg-transparent"
      asChild
    >
      <Link to="/auth/sign-in">Sign in</Link>
    </Button>
    <Button
      $variant="outline"
      className="text-primary-foreground bg-transparent"
      asChild
    >
      <Link to="/auth/sign-up">Sign up</Link>
    </Button>
  </div>
);

export const LoggedInNavBarAvatar = ({
  handleSignOut,
  className,
}: {
  handleSignOut: () => void;
  className?: string | undefined;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className={className} $variant="ghost" $size="icon">
        <AccessibleIcon label="Profile and Settings menu">
          <AvatarIcon className="text-primary-foreground size-5" />
        </AccessibleIcon>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const NavBarAvatar = ({ className }: { className?: string }) => {
  const resetCache = useResetCache();

  const { status, error } = useCurrentUser();
  const signOut = trpc.user.signOut.useMutation();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    await resetCache();
  };

  if (status == 'success') {
    return (
      <LoggedInNavBarAvatar
        className={className}
        handleSignOut={handleSignOut}
      />
    );
  }

  if (
    status === 'error' &&
    (error.data?.httpStatus === 401 || error.data?.httpStatus === 403)
  ) {
    return <LoggedOutNavBarAvatar className={className} />;
  }

  return null;
};
