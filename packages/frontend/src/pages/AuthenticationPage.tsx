import { useMatch } from 'react-router-dom';

import { AuthenticationForm } from '../components/AuthenticationForm';

import { Root } from './Root';

export const AuthenticationPage = () => {
  const isSignUp = useMatch('/auth/sign-up');

  return (
    <Root title="Expenses">
      <AuthenticationForm isSignUp={isSignUp != null} />
    </Root>
  );
};
