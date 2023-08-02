import { useQueryClient } from '@tanstack/react-query';
import { MdAccountCircle } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { trpc } from '../api/trpc';

export const NavBarAvatar = () => {
  const queryClient = useQueryClient();

  const { data, status, error } = trpc.user.me.useQuery();
  const signOut = trpc.user.signOut.useMutation();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    await queryClient.resetQueries();
  };

  if (status == 'success') {
    return (
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          className="btn btn-circle btn-ghost text-3xl"
          aria-label="Account"
        >
          <MdAccountCircle />
        </div>

        <ul
          tabIndex={0}
          className="menu dropdown-content rounded-box z-[2] mt-3 w-52 bg-base-200 p-2 text-primary shadow"
        >
          <li>
            <Link to="/settings" className="justify-between">
              {data.name}
            </Link>
          </li>
          <li>
            <a onClick={handleSignOut}>Sign out</a>
          </li>
        </ul>
      </div>
    );
  }

  if (status === 'error' && error.data?.httpStatus === 401) {
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
