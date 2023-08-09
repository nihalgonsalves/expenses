import { MdAccountCircle } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { useResetCache } from '../api/useCacheReset';
import { useCurrentUser } from '../api/useCurrentUser';

import { DropdownMenu } from './DropdownMenu';

export const NavBarAvatar = () => {
  const resetCache = useResetCache();

  const { status, error } = useCurrentUser();
  const signOut = trpc.user.signOut.useMutation();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    await resetCache();
  };

  if (status == 'success') {
    return (
      <DropdownMenu icon={<MdAccountCircle />} aria-label="Account">
        <li>
          <a onClick={handleSignOut}>Sign out</a>
        </li>
      </DropdownMenu>
    );
  }

  if (
    status === 'error' &&
    (error.data?.httpStatus === 401 || error.data?.httpStatus === 403)
  ) {
    return (
      <>
        <Link className="btn btn-ghost" to="/auth/sign-in">
          Sign in
        </Link>
        <Link className="btn btn-ghost" to="/auth/sign-up">
          Sign up
        </Link>
      </>
    );
  }

  return null;
};
