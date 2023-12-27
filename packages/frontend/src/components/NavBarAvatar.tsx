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

export const LoggedOutNavBarAvatar = () => (
  <div className="flex gap-2">
    <Button variant="outline" asChild>
      <Link to="/auth/sign-in">Sign in</Link>
    </Button>
    <Button variant="outline" asChild>
      <Link to="/auth/sign-up">Sign up</Link>
    </Button>
  </div>
);

export const LoggedInNavBarAvatar = ({
  handleSignOut,
}: {
  handleSignOut: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <AvatarIcon className="size-5 text-primary-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const NavBarAvatar = () => {
  const resetCache = useResetCache();

  const { status, error } = useCurrentUser();
  const signOut = trpc.user.signOut.useMutation();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    await resetCache();
  };

  if (status == 'success') {
    return <LoggedInNavBarAvatar handleSignOut={handleSignOut} />;
  }

  if (
    status === 'error' &&
    (error.data?.httpStatus === 401 || error.data?.httpStatus === 403)
  ) {
    return <LoggedOutNavBarAvatar />;
  }

  return null;
};
