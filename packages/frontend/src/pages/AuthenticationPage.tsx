import { Navigate, useMatch, useSearchParams } from 'react-router-dom';

import { useCurrentUser } from '../api/useCurrentUser';
import { AuthenticationForm } from '../components/AuthenticationForm';

import { Root } from './Root';

export const AuthenticationPage = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = useMatch('/auth/sign-up');

  const { data, error } = useCurrentUser();

  if (data?.id && !error) {
    const redirect = searchParams.get('redirect');

    return <Navigate to={redirect ?? '/'} replace />;
  }

  return (
    <Root title={isSignUp ? 'Sign up' : 'Sign in'}>
      <AuthenticationForm isSignUp={isSignUp != null} />
    </Root>
  );
};
