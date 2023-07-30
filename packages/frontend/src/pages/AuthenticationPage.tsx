import { Navigate, useMatch, useSearchParams } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { AuthenticationForm } from '../components/AuthenticationForm';

import { Root } from './Root';

export const AuthenticationPage = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = useMatch('/auth/sign-up');

  const { data } = trpc.user.me.useQuery(undefined, {
    retry: false,
  });

  if (data?.id) {
    const redirect = searchParams.get('redirect');

    return <Navigate to={redirect ?? '/'} />;
  }

  return (
    <Root title="Expenses">
      <AuthenticationForm isSignUp={isSignUp != null} />
    </Root>
  );
};
