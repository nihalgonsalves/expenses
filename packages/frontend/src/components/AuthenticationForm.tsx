import { useState } from 'react';

import { trpc } from '../api/trpc';
import { useResetCache } from '../api/useCacheReset';
import { prevalidateEmail } from '../utils/utils';

import { LoadingButton } from './form/LoadingButton';
import { TextField } from './form/TextField';

export const AuthenticationForm = ({ isSignUp }: { isSignUp: boolean }) => {
  const [name, setName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resetCache = useResetCache();

  const signUpMutation = trpc.user.createUser.useMutation();
  const signInMutation = trpc.user.authorizeUser.useMutation();

  const emailValid = prevalidateEmail(email);
  const passwordValid = password.length > 0;

  const signInValid = emailValid && passwordValid;
  const valid = isSignUp ? name !== '' && signInValid : signInValid;

  const isLoading = signUpMutation.isLoading || signInMutation.isLoading;

  const handleAuthenticate = async () => {
    if (isSignUp) {
      await signUpMutation.mutateAsync({ name, email, password });
    } else {
      await signInMutation.mutateAsync({ email, password });
    }

    await resetCache();
  };

  return (
    <form
      className="flex flex-col "
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid) {
          return;
        }

        void handleAuthenticate();
      }}
    >
      {isSignUp && (
        <TextField
          label="Name"
          autoComplete="name"
          autoFocus
          value={name}
          setValue={setName}
        />
      )}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus={!isSignUp}
        value={email}
        setValue={setEmail}
      />

      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        autoFocus={!isSignUp}
        value={password}
        setValue={setPassword}
      />

      <div className="divider" />

      <LoadingButton type="submit" isLoading={isLoading} disabled={!valid}>
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </LoadingButton>
    </form>
  );
};
