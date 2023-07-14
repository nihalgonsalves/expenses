import { useMatch } from 'react-router-dom';

import { AuthenticationForm } from '../components/AuthenticationForm';

export const AuthenticationPage = () => {
  const isSignUp = useMatch('/auth/sign-up');

  return <AuthenticationForm isSignUp={isSignUp != null} />;
};
